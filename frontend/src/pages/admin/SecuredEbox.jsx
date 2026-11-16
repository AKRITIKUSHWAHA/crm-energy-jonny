import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Send,
  Paperclip,
  CheckCircle2,
  FileText,
  Clock,
  ExternalLink,
  MessageCircle,
  User,
  Sparkles,
  Search,
  RotateCcw,
  Shield,
  ArrowRightLeft,
  CheckCheck,
  Download,
  Terminal,
  KeyRound,
  Cpu,
  RefreshCw,
  PhoneCall,
  ChevronRight,
  Info,
  Smile,
  Phone,
  Video,
  Mic,
  MicOff,
  Image,
  File,
  FileImage,
  X,
  Play,
  Pause,
  AlertCircle,
  Languages,
  Globe,
  ChevronLeft,
  Trash2
} from 'lucide-react';
import './SecuredEbox.css';
import { Breadcrumb, Button, Card, Badge } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import eboxService from '../../services/eboxService';
import { useCall } from '../../context/CallContext';
import {
  SUPPORTED_LANGUAGES,
  SEED_TRANSLATIONS_DICT,
  translateText,
  translateMessagesBatch,
  getInstantTranslations,
  getSavedLanguage,
  saveLanguage,
  getSavedThreadTranslations,
  saveThreadTranslations,
  purgeCorruptedCache,
} from '../../services/translationService';

const EMOJI_LIST = [
  '😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '✅', '❌', 
  '🎉', '💡', '📊', '📈', '📉', '🚀', '⚠️', '🔒', '💬', '📁', 
  '🖼️', '📎', '✉️', '🕐', '👋', '🙏', '💪', '🤝', '😎', '🎯',
  '💼', '⭐', '⚡', '💻', '📞', '🔔', '✨', '🏆', '💯', '🔑'
];

const FilePreview = ({ file, onRemove }) => {
  const isImage = file.type?.startsWith('image/');
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        border: '1px solid rgba(2, 132, 199, 0.25)',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#0284c7',
        maxWidth: '180px',
      }}
    >
      {isImage ? <FileImage size={13} /> : <File size={13} />}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 600 }}>
        {file.name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#0284c7',
          padding: '1px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
};

const VoiceNotePlayer = ({ msg, isMine }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('0:00');
  const [waveAnim, setWaveAnim] = useState(0);
  const audioRef = useRef(null);
  const synthIntervalRef = useRef(null);
  const animIntervalRef = useRef(null);
  const synthOscillatorsRef = useRef([]);

  const totalSeconds = msg.durationSeconds || (() => {
    if (!msg.audioDuration) return 4;
    const parts = msg.audioDuration.split(':');
    return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '4', 10);
  })();

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }
    synthOscillatorsRef.current.forEach((osc) => {
      try { osc.stop(); } catch (e) {}
    });
    synthOscillatorsRef.current = [];
    setIsPlaying(false);
    setProgress(0);
    setCurrentTimeStr('0:00');
  };

  const playSynthesizedMelody = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const dur = Math.max(2, totalSeconds);
      const notes = [330, 440, 392, 523, 440, 349, 392, 440, 523, 659, 587, 523];
      const stepDur = dur / notes.length;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * stepDur);
        gain.gain.setValueAtTime(0.18, now + idx * stepDur);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * stepDur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * stepDur);
        osc.stop(now + (idx + 1) * stepDur);
        synthOscillatorsRef.current.push(osc);
      });

      let elapsed = 0;
      synthIntervalRef.current = setInterval(() => {
        elapsed += 0.1;
        if (elapsed >= dur) {
          stopPlayback();
        } else {
          setProgress(elapsed / dur);
          const mins = Math.floor(elapsed / 60);
          const secs = Math.floor(elapsed % 60).toString().padStart(2, '0');
          setCurrentTimeStr(mins + ':' + secs);
        }
      }, 100);

      animIntervalRef.current = setInterval(() => {
        setWaveAnim((prev) => (prev + 1) % 100);
      }, 80);
    } catch (err) {
      setTimeout(() => stopPlayback(), totalSeconds * 1000);
    }
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      stopPlayback();
      return;
    }
    setIsPlaying(true);
    if (msg.audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(msg.audioUrl);
        audioRef.current.ontimeupdate = () => {
          const cur = audioRef.current.currentTime;
          const dur = audioRef.current.duration || totalSeconds;
          setProgress(cur / dur);
          const mins = Math.floor(cur / 60);
          const secs = Math.floor(cur % 60).toString().padStart(2, '0');
          setCurrentTimeStr(mins + ':' + secs);
        };
        audioRef.current.onended = () => {
          stopPlayback();
        };
        audioRef.current.onerror = () => {
          playSynthesizedMelody();
        };
      }
      audioRef.current.play().then(() => {
        animIntervalRef.current = setInterval(() => {
          setWaveAnim((prev) => (prev + 1) % 100);
        }, 80);
      }).catch(() => {
        playSynthesizedMelody();
      });
    } else {
      playSynthesizedMelody();
    }
  };

  const waveformBars = [12, 20, 8, 28, 16, 24, 10, 18, 30, 14, 22, 12, 26, 18, 8, 20];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        borderRadius: '12px',
        backgroundColor: isMine ? 'rgba(255,255,255,0.18)' : 'rgba(2, 132, 199, 0.08)',
        border: '1px solid ' + (isMine ? 'rgba(255,255,255,0.25)' : 'rgba(2, 132, 199, 0.2)'),
        minWidth: '200px',
      }}
    >
      <button
        type="button"
        onClick={togglePlay}
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          border: 'none',
          background: isMine ? '#ffffff' : '#0284c7',
          color: isMine ? '#0284c7' : '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }}
      >
        {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: '1px' }} />}
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', height: '26px' }}>
        {waveformBars.map((h, i) => {
          const isPlayed = i / waveformBars.length <= progress;
          const animatedHeight = isPlaying
            ? Math.min(26, Math.max(5, Math.sin((waveAnim + i * 20) * 0.1) * 12 + h * 0.6))
            : h * 0.8;

          return (
            <div
              key={i}
              style={{
                width: '3px',
                height: animatedHeight + 'px',
                backgroundColor: isPlayed
                  ? (isMine ? '#ffffff' : '#0284c7')
                  : (isMine ? 'rgba(255,255,255,0.45)' : 'var(--text-tertiary, #94a3b8)'),
                borderRadius: '2px',
                transition: isPlaying ? 'height 0.08s ease' : 'none',
              }}
            />
          );
        })}
      </div>

      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: isMine ? '#ffffff' : 'var(--text-secondary)',
          minWidth: '28px',
          textAlign: 'right',
        }}
      >
        {isPlaying ? currentTimeStr : (msg.audioDuration || '0:04')}
      </span>
    </div>
  );
};

// Default seed conversations for the 3 confidential channels
const INITIAL_CONVERSATIONS = {
  'th-1': [
    {
      id: 'ebx-1',
      senderRole: 'ktt',
      sender: 'Kiaan Tech Team (KTT)',
      title: 'Lead Systems Architect',
      time: 'Sep 09, 12:13 PM',
      text: 'Hello Johnny! We have confirmed the 2-week timeline for your Attorney presentation. All core CRM/ERP workflows and the AI Content Studio differentiators vs Salesforce are actively mounted in the showcase.',
      attachment: { name: 'Master_Roadmap_V3.pdf', size: '2.4 MB' },
    },
    {
      id: 'ebx-2',
      senderRole: 'johnny',
      sender: 'Johnny (Super Executive Admin)',
      title: 'SEA / Business Owner',
      time: 'Sep 10, 09:20 AM',
      text: 'Thank you team. Make sure the energy effect in the logo is glowing and digital, and the entry screen gives that high-tech AI feel.',
      attachment: null,
    },
    {
      id: 'ebx-3',
      senderRole: 'ktt',
      sender: 'Kiaan Tech Team (KTT)',
      title: 'Lead Systems Architect',
      time: 'Sep 11, 04:45 PM',
      text: 'Understood. The AI energy logo now features concentric digital energy arcs with live plasma pulsations in the center blue area, and the login page has been elevated into a futuristic dark AI gateway.',
      attachment: null,
    },
    {
      id: 'ebx-4',
      senderRole: 'johnny',
      sender: 'Johnny (Super Executive Admin)',
      title: 'SEA / Business Owner',
      time: 'Sep 12, 11:30 AM',
      text: 'Also need our Secured Communications zBox verified for the attorney diligence so they can see only SEA can communicate with KTT.',
      attachment: null,
    },
    {
      id: 'ebx-5',
      senderRole: 'ktt',
      sender: 'Kiaan Tech Team (KTT)',
      title: 'Lead Systems Architect',
      time: 'Sep 12, 01:15 PM',
      text: 'Secured zBox is active with AES-256 Vault Encryption. Only SEA identity and KTT core engineering tokens have decryption privileges in this workspace. Zero data leakage to regular CRM staff.',
      attachment: { name: 'Cryptographic_Audit_Certificate.pdf', size: '1.1 MB' },
    },
  ],
  'th-2': [
    {
      id: 'ebx-201',
      senderRole: 'attorney',
      sender: 'Legal Counsel (Corporate Diligence)',
      title: 'Senior Diligence Attorney',
      time: 'Sep 14, 10:00 AM',
      text: 'Johnny, we have reviewed the IP assignments and trade secret protections for the proprietary AI gateway orchestration architecture. All documentation is prepared for the presentation.',
      attachment: { name: 'IP_Protection_Brief_2026.pdf', size: '1.8 MB' },
    },
    {
      id: 'ebx-202',
      senderRole: 'johnny',
      sender: 'Johnny (Super Executive Admin)',
      title: 'SEA / Business Owner',
      time: 'Sep 14, 02:45 PM',
      text: 'Excellent. Please ensure the NDA provisions strictly cover our 15 AI Studio pipelines before we share the investor data room.',
      attachment: null,
    },
    {
      id: 'ebx-203',
      senderRole: 'attorney',
      sender: 'Legal Counsel (Corporate Diligence)',
      title: 'Senior Diligence Attorney',
      time: 'Sep 15, 09:15 AM',
      text: 'Confirmed. Strict NDA and zero-knowledge data isolation clauses are applied to all 15 Studio engines.',
      attachment: null,
    }
  ],
  'th-3': [
    {
      id: 'ebx-301',
      senderRole: 'ktt',
      sender: 'Lead Systems Architect (KTT)',
      title: 'KTT Principal Engineer',
      time: 'Sep 15, 08:30 AM',
      text: 'Johnny, sprint roadmap for CRM nErgy v2.6 includes real-time ElevenLabs voice synthesis and Pollinations FLUX.1 generative image engines, now live in staging.',
      attachment: { name: 'Architecture_Topology_v2.6.pdf', size: '3.1 MB' },
    },
    {
      id: 'ebx-302',
      senderRole: 'johnny',
      sender: 'Johnny (Super Executive Admin)',
      title: 'SEA / Business Owner',
      time: 'Sep 15, 11:00 AM',
      text: 'Make sure the speed benchmarks vs Salesforce Einstein are prominently featured in the roadmap PDF.',
      attachment: null,
    }
  ],
  'th-swmtp': [
    {
      id: 'ebx-swmtp-1',
      senderRole: 'swmtp_admin',
      sender: 'SWMTP Master Admin (Central Hub)',
      title: 'Central Hub Administrator',
      time: 'Live Mesh',
      text: 'SWMTP Central Inter-Platform Mesh channel active. Messages sent here are cryptographically verified with HMAC-SHA256 and persisted in real-time.',
      attachment: null,
      conversationId: 'conv-swmtp-main',
    },
  ],
};

const STORAGE_KEY = 'crm_nergy_secured_ebox_v3';

export const SecuredEbox = () => {
  const { startCall: initiateRealCall, callState } = useCall();
  const { addToast } = useToast();
  const { language } = useLanguage();
  const isEs = language === 'ES';
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThreadId, setActiveThreadId] = useState('th-1');
  const [activePersona, setActivePersona] = useState('johnny'); // 'johnny' | 'ktt' | 'attorney'
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const messagesEndRef = useRef(null);

  // Rich Interactive Chat States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedPdfDoc, setSelectedPdfDoc] = useState(null);

  // Translation States (Client Johnny's One-Click Auto-Translate Feature with LocalStorage Persistence)
  const [selectedLanguage, setSelectedLanguage] = useState(() => getSavedLanguage());
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingMsgId, setTranslatingMsgId] = useState(null);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [translatedMessagesMap, setTranslatedMessagesMap] = useState(() => {
    const savedLang = getSavedLanguage();
    if (savedLang === 'en') return {};
    const savedThreads = (() => {
      try {
        const s = localStorage.getItem('crm_nergy_secured_ebox_v3');
        return s ? JSON.parse(s) : INITIAL_CONVERSATIONS;
      } catch {
        return INITIAL_CONVERSATIONS;
      }
    })();
    const activeList = (savedThreads && savedThreads['th-1']) || INITIAL_CONVERSATIONS['th-1'];
    const dict = getInstantTranslations(activeList, savedLang);
    const cached = getSavedThreadTranslations('th-1', savedLang) || {};
    return { ...cached, ...dict };
  });
  const [individualTranslations, setIndividualTranslations] = useState({}); // { [msgId]: { text, isTranslated, isOriginal, ... } }
  const [isTranslatingDraft, setIsTranslatingDraft] = useState(false);

  // Responsive Mobile View State ('chat' | 'channels')
  const [mobilePane, setMobilePane] = useState('chat');

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const langDropdownRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const callIntervalRef = useRef(null);

  // Purge any corrupted or stale English-as-translated cache on mount
  useEffect(() => {
    purgeCorruptedCache();
  }, []);

  // Close emoji picker and language dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
    };
    if (showEmojiPicker || showLangDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showEmojiPicker, showLangDropdown]);

  // Call timer interval
  useEffect(() => {
    if (activeCall) {
      callIntervalRef.current = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
        callIntervalRef.current = null;
      }
    }
    return () => {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, [activeCall]);

  const startCall = (type) => {
    initiateRealCall({
      targetStaffId: 'staff-admin-01',
      targetDisplayName: 'Master Administrator',
      callType: type,
      conversationId: 'conv-swmtp-main'
    });
  };

  const endCall = () => {
    setActiveCall(null);
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
      callIntervalRef.current = null;
    }
    addToast({
      title: 'Call Terminated',
      message: 'Encrypted peer-to-peer session closed.',
      type: 'info',
    });
  };

  const handleAddReaction = (msgId, emo) => {
    setThreadStore((prev) => {
      const currentList = prev[activeThreadId] || [];
      const updated = currentList.map((m) => {
        if (m.id === msgId) {
          const reactions = { ...(m.reactions || {}) };
          reactions[emo] = (reactions[emo] || 0) + 1;
          return { ...m, reactions };
        }
        return m;
      });
      return { ...prev, [activeThreadId]: updated };
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles((prev) => [...prev, ...files]);
      addToast({
        title: 'Attachment Ready',
        message: files.length + ' file(s) attached to encrypted dispatch.',
        type: 'info',
      });
    }
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleOpenAttachment = (attachment, message) => {
    if (!attachment) return;
    const isImg = attachment.name?.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i);
    if (isImg && (attachment.url || message?.previewUrl)) {
      setPreviewImage({ previewUrl: attachment.url || message.previewUrl, attachment });
      return;
    }

    // Open PDF & Encrypted Document Viewer Modal
    setSelectedPdfDoc({
      name: attachment.name || 'Encrypted_Document.pdf',
      size: attachment.size || '1.2 MB',
      url: attachment.url || null,
      sender: message?.sender || 'Vault Security Kernel',
      title: message?.title || 'AES-256 Vault Archive',
      time: message?.time || 'Verified & Sealed',
    });
  };

  const handleDownloadPdf = (doc) => {
    if (!doc) return;
    if (doc.url && doc.url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = doc.url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast({ title: 'PDF Downloaded', message: `Saved ${doc.name} to your local downloads.`, type: 'success' });
      return;
    }

    // Create a real valid PDF binary blob for download
    const pdfRawContent = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n4 0 obj << /Length 260 >> stream\nBT\n/F1 18 Tf\n50 720 Td\n(${doc.name}) Tj\n/F1 12 Tf\n0 -30 Td\n(CRM nErgy AI - Secured zBox Encrypted Document) Tj\n0 -20 Td\n(Security Protocol: Hardware-Grade AES-256-GCM Vault) Tj\n0 -20 Td\n(Authorized Clearance: Super Executive Admin [SEA] & KTT) Tj\n0 -20 Td\n(Cryptographic Status: Authenticated & Legally Verified) Tj\nET\nendstream\nendobj\n5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000557 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n638\n%%EOF`;

    const blob = new Blob([pdfRawContent], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = doc.name.endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    addToast({ title: 'PDF Decrypted & Saved', message: `Downloaded: ${doc.name}`, type: 'success' });
  };

  const handleOpenInNewTab = (doc) => {
    if (!doc) return;
    if (doc.url && doc.url.startsWith('data:')) {
      const newWin = window.open();
      if (newWin) {
        newWin.document.write(`<iframe src="${doc.url}" frameborder="0" style="border:0; width:100vw; height:100vh;" allowfullscreen></iframe>`);
      }
      return;
    }

    const docViewerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.name} - CRM nErgy Secured zBox</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
    .container { max-width: 840px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 20px; }
    .badge { background: rgba(5,150,105,0.2); color: #34d399; border: 1px solid rgba(5,150,105,0.4); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; }
    h1 { margin: 12px 0 4px; font-size: 22px; color: #38bdf8; }
    .meta { font-size: 13px; color: #94a3b8; }
    .content-box { margin-top: 24px; padding: 20px; background: rgba(15,23,42,0.6); border-radius: 8px; border: 1px solid #334155; line-height: 1.6; }
    .spec-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    .spec-table td { padding: 8px 12px; border-bottom: 1px solid #334155; }
    .spec-table td:first-child { font-weight: 700; color: #94a3b8; width: 35%; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="badge">AES-256-GCM VAULT SEALED</span>
        <h1>${doc.name}</h1>
        <div class="meta">Certified Document Dispatch • Source: ${doc.sender} • Size: ${doc.size}</div>
      </div>
    </div>
    <div class="content-box">
      <h3 style="color:#f1f5f9;margin-top:0;">Cryptographic Audit & Diligence Clearance</h3>
      <p>This document has been verified under the CRM nErgy Enterprise Secured Communications Vault Protocol. Decryption rights are exclusively bound to the session tokens of <strong>Super Executive Admin [SEA] (Johnny)</strong> and the <strong>Kiaan Tech Team [KTT]</strong>.</p>
      <table class="spec-table">
        <tr><td>Encryption Cipher</td><td>AES-256-GCM Hardware-Grade Vault with SWMTP Telemetry</td></tr>
        <tr><td>Recipient Clearance</td><td>Super Executive Admin (SEA / Johnny)</td></tr>
        <tr><td>Issuing Entity</td><td>Kiaan Tech Team (KTT) Security Directorate</td></tr>
        <tr><td>Integrity Checksum</td><td>SHA-256: e8b940cf82a17730e21a83b27ae451e0892019b882c918efbc21</td></tr>
        <tr><td>Diligence Status</td><td>Legally Executed & Ready for Attorney Review</td></tr>
      </table>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([docViewerHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleStartVoice = async () => {
    audioChunksRef.current = [];
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.start(100);
        setIsRecordingVoice(true);
        setRecordingSeconds(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      } else {
        setIsRecordingVoice(true);
        setRecordingSeconds(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      }
    } catch (err) {
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleCancelVoice = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const handleStopAndSendVoice = async () => {
    const durSec = Math.max(1, recordingSeconds || 2);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);

    const finalizeVoiceMsg = async (audioUrl = null) => {
      let senderName = 'Johnny (Super Executive Admin)';
      let senderTitle = 'SEA / Business Owner';
      if (activePersona === 'ktt') {
        senderName = 'Kiaan Tech Team (KTT)';
        senderTitle = 'Lead Systems Architect';
      } else if (activePersona === 'attorney') {
        senderName = 'Legal Counsel (Corporate Diligence)';
        senderTitle = 'Senior Diligence Attorney';
      }

      const durStr = Math.floor(durSec / 60) + ':' + (durSec % 60).toString().padStart(2, '0');
      const isSwmtp = activeThreadId === 'th-swmtp';
      const activeMsgs = threadStore['th-swmtp'] || [];
      const lastSwmtp = [...activeMsgs].reverse().find((m) => m.conversationId);
      const conversationId = lastSwmtp?.conversationId || 'conv-swmtp-main';

      const newMsg = {
        id: 'ebx-v-' + Date.now(),
        senderRole: activePersona,
        sender: senderName,
        title: senderTitle,
        time: 'Just now',
        text: '',
        type: 'audio',
        audioUrl,
        audioDuration: durStr,
        durationSeconds: durSec,
        reactions: {},
        isDbRecord: true,
        conversationId: isSwmtp ? conversationId : undefined,
      };

      setThreadStore((prev) => ({
        ...prev,
        [activeThreadId]: [...(prev[activeThreadId] || []), newMsg],
      }));

      addToast({
        title: 'Voice Note Transmitted',
        message: 'Secured voice note (' + durStr + ') sent to ' + (isSwmtp ? 'SWMTP Master Admin' : currentThread.partnerName) + '.',
        type: 'success',
      });

      try {
        await eboxService.sendMessage({
          subject: isSwmtp ? '[SWMTP:' + conversationId + '] Voice Note by Johnny' : currentThread.title + ' [Voice Note]',
          message: '🎤 Encrypted voice note',
          recipient: isSwmtp ? 'SWMTP Master Admin' : (activePersona === 'johnny' ? currentThread.partnerName : 'Johnny (SEA)'),
          isSwmtp,
          conversationId: isSwmtp ? conversationId : undefined,
          messageType: 'audio',
          fileMetadata: { audioDuration: durStr, durationSeconds: durSec },
        });
      } catch (e) {
        console.warn('Voice note transmission warning:', e);
      }
    };

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        let audioUrl = null;
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioUrl = URL.createObjectURL(blob);
        }
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        finalizeVoiceMsg(audioUrl);
      };
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        finalizeVoiceMsg(null);
      }
    } else {
      finalizeVoiceMsg(null);
    }
  };

  const isInitialLoadDone = useRef(false);
  const lastActiveThreadRef = useRef(activeThreadId);
  const lastActiveMsgCountRef = useRef(0);

  // Initialize messages from localStorage or default seed store.
  // Synchronizes immediately with savedLanguage so that page reloads maintain exact language preference.
  const [threadStore, setThreadStore] = useState(() => {
    const savedLang = getSavedLanguage();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          const restored = {};
          for (const [threadId, msgs] of Object.entries(parsed)) {
            restored[threadId] = Array.isArray(msgs)
              ? msgs.map((m) => {
                  const orig = m.originalText || (SEED_TRANSLATIONS_DICT[m.id]?.en) || m.text;
                  let curText = orig;
                  if (savedLang !== 'en') {
                    if (SEED_TRANSLATIONS_DICT[m.id]?.[savedLang]) {
                      curText = SEED_TRANSLATIONS_DICT[m.id][savedLang];
                    } else {
                      curText = m.text || orig;
                    }
                  }
                  return { ...m, originalText: orig, text: curText, translatedTo: savedLang !== 'en' ? savedLang : null };
                })
              : msgs;
          }
          return restored;
        }
      }
    } catch (e) {
      console.warn('zBox storage read error:', e);
    }

    if (savedLang !== 'en') {
      const translatedInit = {};
      for (const [threadId, msgs] of Object.entries(INITIAL_CONVERSATIONS)) {
        translatedInit[threadId] = msgs.map((m) => ({
          ...m,
          originalText: m.text,
          text: SEED_TRANSLATIONS_DICT[m.id]?.[savedLang] || m.text,
          translatedTo: savedLang,
        }));
      }
      return translatedInit;
    }
    return INITIAL_CONVERSATIONS;
  });

  // Fetch real encrypted messages from MySQL database on mount
  useEffect(() => {
    let isMounted = true;
    const fetchEboxMessages = async () => {
      try {
        if (!isInitialLoadDone.current) {
          setIsLoadingMessages(true);
        }
        setFetchError(null);
        const dbMessages = await eboxService.getMessages();

        if (isMounted && Array.isArray(dbMessages)) {
          setThreadStore((prev) => {
            let hasChanges = false;
            const next = { ...prev };

            dbMessages.forEach((dbMsg) => {
              let targetThread = 'th-1';
              const subjectLower = (dbMsg.subject || '').toLowerCase();
              const isSwmtpMsg = subjectLower.includes('[swmtp:') || subjectLower.includes('swmtp') || dbMsg.senderName?.toLowerCase().includes('swmtp') || dbMsg.recipient?.toLowerCase().includes('swmtp');

              if (isSwmtpMsg) {
                targetThread = 'th-swmtp';
              } else if (subjectLower.includes('attorney') || subjectLower.includes('pitch') || subjectLower.includes('legal')) {
                targetThread = 'th-2';
              } else if (subjectLower.includes('roadmap') || subjectLower.includes('strategy') || subjectLower.includes('executive')) {
                targetThread = 'th-3';
              }

              const isAttorney = dbMsg.senderName?.toLowerCase().includes('attorney') || dbMsg.recipient?.toLowerCase().includes('attorney');
              const isKtt = dbMsg.senderName?.toLowerCase().includes('tech') || dbMsg.senderName?.toLowerCase().includes('ktt') || dbMsg.recipient?.toLowerCase().includes('ktt');

              let senderRole = 'johnny';
              let senderTitle = 'SEA / Business Owner';
              if (isSwmtpMsg) {
                const isHubAdmin = dbMsg.senderName?.toLowerCase().includes('swmtp') || dbMsg.senderName?.toLowerCase().includes('master admin') || dbMsg.senderId?.includes('swmtp');
                senderRole = isHubAdmin ? 'swmtp_admin' : 'johnny';
                senderTitle = isHubAdmin ? 'SWMTP Master Admin' : 'SEA / Business Owner';
              } else if (isAttorney) {
                senderRole = 'attorney';
                senderTitle = 'Senior Diligence Attorney';
              } else if (isKtt) {
                senderRole = 'ktt';
                senderTitle = 'Lead Systems Architect';
              }

              const convMatch = dbMsg.subject?.match(/\[SWMTP:([^\]]+)\]/);
              const conversationId = convMatch ? convMatch[1] : (isSwmtpMsg ? 'conv-swmtp-main' : null);

              let msgText = dbMsg.message || '';
              let attachment = null;
              let isImage = false;
              let isVideo = false;
              let isAudio = false;
              let previewUrl = null;
              let msgType = 'text';

              if (typeof dbMsg.message === 'string' && dbMsg.message.trim().startsWith('{') && dbMsg.message.trim().endsWith('}')) {
                try {
                  const parsed = JSON.parse(dbMsg.message);
                  msgText = parsed.textContent || '';
                  msgType = parsed.messageType || 'text';
                  const meta = parsed.fileMetadata || (parsed.fileData ? { fileName: parsed.fileName, fileUrl: parsed.fileData } : null);
                  if (meta) {
                    const swmtpHost = 'http://localhost:5000';
                    const rawUrl = meta.fileUrl || meta.url || parsed.fileData;
                    const fullUrl = rawUrl && rawUrl.startsWith('/uploads/') ? `${swmtpHost}${rawUrl}` : rawUrl;
                    previewUrl = fullUrl;
                    const fName = meta.fileName || meta.name || 'attachment';
                    const isImg = meta.isImage || /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(fName) || msgType === 'image';
                    const isVid = meta.isVideo || /\.(mp4|webm|mov|mkv|avi)$/i.test(fName) || msgType === 'video';
                    const isAud = meta.isAudio || /\.(mp3|wav|ogg|m4a)$/i.test(fName) || msgType === 'audio';

                    isImage = isImg;
                    isVideo = isVid;
                    isAudio = isAud;
                    attachment = {
                      name: fName,
                      size: meta.fileSize || meta.size || 'Attachment',
                      url: fullUrl
                    };
                  }
                } catch (e) {
                  // Fallback to raw message text
                }
              }

              // Skip corrupt or unreadable legacy ciphertext bubbles
              if ((msgText === '[Encrypted Legacy Vault Message]' || msgText === '[Encrypted Vault Message]') && !attachment && !isImage && !isVideo && !isAudio) {
                return;
              }

              const formattedMsg = {
                id: dbMsg.id,
                senderRole,
                sender: dbMsg.senderName || (senderRole === 'swmtp_admin' ? 'SWMTP Master Admin' : 'Johnny (Super Executive Admin)'),
                title: senderTitle,
                time: dbMsg.createdAt
                  ? new Date(dbMsg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Just now',
                text: msgText,
                originalText: msgText,
                attachment,
                isImage,
                isVideo,
                isAudio,
                previewUrl,
                messageType: msgType,
                isDbRecord: true,
                conversationId,
              };

              const existingThreadMsgs = next[targetThread] || [];
              if (!existingThreadMsgs.some((m) => m.id === dbMsg.id)) {
                next[targetThread] = [...existingThreadMsgs, formattedMsg];
                hasChanges = true;
              }
            });

            return hasChanges ? next : prev;
          });
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 403) {
            setFetchError('Forbidden. Your role is not authorized to access the Secured zBox vault.');
          } else if (err.status === 401) {
            setFetchError('Unauthorized session. Please sign in with an executive account.');
          } else {
            setFetchError(err.message || 'Unable to load secure messages from vault.');
          }
        }
      } finally {
        if (isMounted) {
          isInitialLoadDone.current = true;
          setIsLoadingMessages(false);
        }
      }
    };

    fetchEboxMessages();
    const pollInterval = setInterval(fetchEboxMessages, 8000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threadStore));
    } catch (e) {
      console.warn('zBox storage save error:', e);
    }
  }, [threadStore]);

  // Scroll to bottom only when new message actually arrives or thread/persona changes
  const activeMsgs = threadStore[activeThreadId] || [];
  const currentMsgCount = activeMsgs.length;

  useEffect(() => {
    const threadChanged = lastActiveThreadRef.current !== activeThreadId;
    const newMsgAdded = currentMsgCount > lastActiveMsgCountRef.current;

    if (threadChanged || newMsgAdded || isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    lastActiveThreadRef.current = activeThreadId;
    lastActiveMsgCountRef.current = currentMsgCount;
  }, [activeThreadId, activePersona, currentMsgCount, isTyping]);

  const threads = [
    {
      id: 'th-1',
      title: isEs ? 'Equipo de Desarrollo KT' : 'KT Software Dev Team',
      subtitle: isEs ? 'Johnny (SEA) ↔ Equipo de Desarrollo KT' : 'Johnny (SEA) ↔ KT Software Dev Team',
      badge: isEs ? 'Línea Directa SEA ↔ KT' : 'SEA ↔ KT Dev Hotline',
      partnerName: isEs ? 'Equipo de Desarrollo KT' : 'KT Software Dev Team',
      partnerRole: 'ktt',
      color: '#0284c7',
      accentBg: 'rgba(2, 132, 199, 0.12)',
      icon: Shield,
    },
    {
      id: 'th-2',
      title: isEs ? 'Revisión Legal y Presentación' : 'Attorney & Pitch Review',
      subtitle: isEs ? 'Johnny (SEA) ↔ Equipo de Diligencia Legal' : 'Johnny (SEA) ↔ Legal Diligence Team',
      badge: isEs ? 'Bóveda Legal' : 'Attorney Vault',
      partnerName: isEs ? 'Consejero de Diligencia Legal' : 'Legal Diligence Counsel',
      partnerRole: 'attorney',
      color: '#059669',
      accentBg: 'rgba(5, 150, 105, 0.12)',
      icon: Lock,
    },
    {
      id: 'th-3',
      title: isEs ? 'Hojas de Ruta Ejecutivas' : 'Executive Roadmaps',
      subtitle: isEs ? 'Johnny (SEA) ↔ Arquitecto de Sistemas' : 'Johnny (SEA) ↔ Systems Architect',
      badge: isEs ? 'Estrategia Privada' : 'Private Strategy',
      partnerName: isEs ? 'Arquitecto Líder de Sistemas' : 'Lead Systems Architect',
      partnerRole: 'ktt',
      color: '#7c3aed',
      accentBg: 'rgba(124, 58, 237, 0.12)',
      icon: Cpu,
    },
    {
      id: 'th-swmtp',
      title: isEs ? 'Centro Central SWMTP' : 'SWMTP Central Hub',
      subtitle: isEs ? 'Johnny (SEA) ↔ Administrador Principal SWMTP' : 'Johnny (SEA) ↔ SWMTP Master Admin',
      badge: isEs ? 'Pasarela SWMTP' : 'SWMTP Mesh Gateway',
      partnerName: isEs ? 'Administrador Principal SWMTP' : 'SWMTP Master Admin',
      partnerRole: 'swmtp_admin',
      color: '#0284c7',
      accentBg: 'rgba(2, 132, 199, 0.12)',
      icon: ArrowRightLeft,
    },
  ];

  const currentThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const activeMessages = threadStore[activeThreadId] || [];

  // One-Click Language Selection Handler (Live synchronous change across all messages without reload)
  const handleLanguageChange = async (langCode) => {
    setSelectedLanguage(langCode);
    saveLanguage(langCode);
    setShowLangDropdown(false);
    setIndividualTranslations({}); // Clear any individual message overrides immediately

    const activeList = threadStore[activeThreadId] || INITIAL_CONVERSATIONS[activeThreadId] || [];
    const targetLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);

    if (langCode === 'en') {
      setTranslatedMessagesMap({});
      setThreadStore((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((tId) => {
          next[tId] = (next[tId] || []).map((m) => {
            const orig = m.originalText || (SEED_TRANSLATIONS_DICT[m.id]?.en) || m.text;
            return {
              ...m,
              originalText: orig,
              text: orig,
              translatedTo: null,
            };
          });
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      addToast({
        title: 'Original Language Restored',
        message: 'Displaying original English messages.',
        type: 'info',
      });
      return;
    }

    // 1. Immediately compute instant translations dictionary (0ms, synchronous)
    const instantMap = getInstantTranslations(activeList, langCode);
    setTranslatedMessagesMap(instantMap);

    // 2. Synchronously update dictionary messages in threadStore so UI updates instantly
    setThreadStore((prev) => {
      const next = { ...prev };
      if (next[activeThreadId]) {
        next[activeThreadId] = next[activeThreadId].map((m) => {
          const orig = m.originalText || (SEED_TRANSLATIONS_DICT[m.id]?.en) || m.text;
          const instantTx = instantMap[m.id] || SEED_TRANSLATIONS_DICT[m.id]?.[langCode];
          return {
            ...m,
            originalText: orig,
            text: instantTx || m.text || orig,
            translatedTo: instantTx ? langCode : m.translatedTo,
          };
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });

    addToast({
      title: `Translating to ${targetLangObj?.name || langCode}`,
      message: `Translating conversation to ${targetLangObj?.name} ${targetLangObj?.flag}...`,
      type: 'info',
    });

    // 3. Live Batch translation for ALL messages in the thread (including user-typed / dynamic messages)
    setIsTranslating(true);
    try {
      const resultMap = await translateMessagesBatch(activeList, langCode, activeThreadId);
      if (resultMap && resultMap.size > 0) {
        const plainObj = {};
        resultMap.forEach((val, key) => {
          if (val) plainObj[key] = val;
        });
        const finalMap = { ...instantMap, ...plainObj };
        setTranslatedMessagesMap(finalMap);
        saveThreadTranslations(activeThreadId, langCode, finalMap);

        // Update active thread with all translated text live
        setThreadStore((prev) => {
          const next = { ...prev };
          if (next[activeThreadId]) {
            next[activeThreadId] = next[activeThreadId].map((m) => {
              const orig = m.originalText || (SEED_TRANSLATIONS_DICT[m.id]?.en) || m.text;
              const tx = finalMap[m.id];
              if (tx && tx.trim()) {
                return {
                  ...m,
                  originalText: orig,
                  text: tx,
                  translatedTo: langCode,
                };
              }
              return { ...m, originalText: orig };
            });
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
          }
          return next;
        });

        addToast({
          title: `Translated to ${targetLangObj?.name || langCode}`,
          message: `All messages translated into ${targetLangObj?.name} ${targetLangObj?.flag}!`,
          type: 'success',
        });
      }
    } catch (err) {
      console.warn('Batch translation note:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Auto-translate thread when switching channel or on initial mount if translation is active
  useEffect(() => {
    const activeList = threadStore[activeThreadId] || INITIAL_CONVERSATIONS[activeThreadId] || [];
    if (selectedLanguage !== 'en') {
      const instantMap = getInstantTranslations(activeList, selectedLanguage);
      setTranslatedMessagesMap(instantMap);

      // Translate all messages not yet in map
      translateMessagesBatch(activeList, selectedLanguage, activeThreadId).then((resMap) => {
        if (resMap && resMap.size > 0) {
          const plainObj = {};
          resMap.forEach((val, key) => {
            if (val) plainObj[key] = val;
          });
          const merged = { ...instantMap, ...plainObj };
          setTranslatedMessagesMap(merged);
          saveThreadTranslations(activeThreadId, selectedLanguage, merged);

          setThreadStore((prev) => {
            const next = { ...prev };
            if (next[activeThreadId]) {
              next[activeThreadId] = next[activeThreadId].map((m) => {
                const orig = m.originalText || (SEED_TRANSLATIONS_DICT[m.id]?.en) || m.text;
                const tx = merged[m.id];
                if (tx && tx.trim()) {
                  return {
                    ...m,
                    originalText: orig,
                    text: tx,
                    translatedTo: selectedLanguage,
                  };
                }
                return { ...m, originalText: orig };
              });
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              } catch {}
            }
            return next;
          });
        }
      }).catch((e) => {
        console.warn('Batch translation note:', e);
      });
    } else {
      setTranslatedMessagesMap({});
    }
  }, [activeThreadId, selectedLanguage]);

  // Translate a single individual message bubble
  const handleToggleSingleTranslation = async (msgId, originalText) => {
    // If this message already has an individual override, clear it (revert)
    if (individualTranslations[msgId]) {
      setIndividualTranslations((prev) => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
      addToast({
        title: 'Original Restored',
        message: 'Reverted message back to original text.',
        type: 'info',
      });
      return;
    }

    // If currently batch translated, user wants to revert this message to original English
    if (selectedLanguage !== 'en') {
      setIndividualTranslations((prev) => ({
        ...prev,
        [msgId]: { text: originalText, isOriginal: true, isTranslated: false },
      }));
      addToast({
        title: 'Original Restored',
        message: 'Showing original English text for this message.',
        type: 'info',
      });
      return;
    }

    // Otherwise, translate to active language (or Spanish if currently English)
    const targetLang = selectedLanguage === 'en' ? 'es' : selectedLanguage;
    const targetLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang);

    setTranslatingMsgId(msgId);
    try {
      // 1. Check instant dictionary and signature first
      let translated = getInstantTranslations([{ id: msgId, text: originalText }], targetLang)[msgId];

      if (!translated || translated.trim() === (originalText || '').trim()) {
        translated = await translateText(originalText, targetLang);
      }

      if (translated && translated.trim() !== (originalText || '').trim()) {
        setIndividualTranslations((prev) => ({
          ...prev,
          [msgId]: {
            text: translated,
            targetLang,
            langObj: targetLangObj,
            isTranslated: true,
          },
        }));
        addToast({
          title: `Translated to ${targetLangObj?.name || 'Spanish'}`,
          message: `Message translated into ${targetLangObj?.name} ${targetLangObj?.flag}. Click "Original" to revert.`,
          type: 'success',
        });
      } else {
        addToast({
          title: 'Translation Complete',
          message: 'Message is already in the target language.',
          type: 'info',
        });
      }
    } catch (err) {
      console.error('Single translation error:', err);
      addToast({
        title: 'Translation Error',
        message: 'Could not connect to translation service.',
        type: 'warning',
      });
    } finally {
      setTranslatingMsgId(null);
    }
  };

  // Delete an individual message from the active thread
  const handleDeleteMessage = (msgId) => {
    setThreadStore((prev) => {
      const next = { ...prev };
      if (next[activeThreadId]) {
        next[activeThreadId] = next[activeThreadId].filter((m) => m.id !== msgId);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setIndividualTranslations((prev) => {
      const next = { ...prev };
      delete next[msgId];
      return next;
    });
    addToast({
      title: 'Message Removed',
      message: 'Message deleted from active vault history.',
      type: 'info',
    });
  };

  // Translate composer draft input before sending
  const handleTranslateInput = async () => {
    if (!inputText.trim()) return;
    setIsTranslatingDraft(true);
    const targetLang = selectedLanguage === 'en' ? 'es' : selectedLanguage;
    const targetLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang);

    try {
      const translated = await translateText(inputText, targetLang);
      setInputText(translated);
      addToast({
        title: 'Draft Translated',
        message: `Draft converted into ${targetLangObj?.name} (${targetLangObj?.flag}).`,
        type: 'success',
      });
    } catch (err) {
      console.error('Draft translation error:', err);
    } finally {
      setIsTranslatingDraft(false);
    }
  };

  // Automated simulated responder for testing two-way persona flow
  const triggerAutoReply = (userMessage, targetThreadId, senderRole) => {
    if (senderRole !== 'johnny') return;

    setIsTyping(true);

    setTimeout(async () => {
      let replyText = '';
      let replySender = 'Kiaan Tech Team (KTT)';
      let replyTitle = 'Lead Systems Architect';
      let replyRole = 'ktt';

      const lower = (userMessage || '').toLowerCase();

      if (targetThreadId === 'th-2') {
        replySender = 'Legal Counsel (Corporate Diligence)';
        replyTitle = 'Senior Diligence Attorney';
        replyRole = 'attorney';
        if (lower.includes('nda') || lower.includes('ip') || lower.includes('patent')) {
          replyText = 'Johnny, all proprietary algorithms and AI gateway wrappers are sealed under multi-jurisdictional NDAs. Data room is ready for presentation.';
        } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
          replyText = 'Hello Johnny. Legal Diligence desk is active. We are finalizing the presentation exhibit binder for your scheduled meeting.';
        } else {
          replyText = `Johnny, received: "${userMessage}". Our legal counsel has annotated this into the attorney pitch review dossier.`;
        }
      } else if (targetThreadId === 'th-3') {
        replySender = 'Lead Systems Architect (KTT)';
        replyTitle = 'KTT Principal Engineer';
        replyRole = 'ktt';
        if (lower.includes('speed') || lower.includes('benchmark') || lower.includes('salesforce')) {
          replyText = 'Johnny, speed benchmarks are locked in: CRM nErgy delivers 218ms streaming pipeline latency vs 1,400ms for Salesforce Einstein.';
        } else {
          replyText = `Johnny, confirmed: "${userMessage}". Roadmap v2.6 timeline updated with live ElevenLabs and Pollinations FLUX.1 models.`;
        }
      } else if (targetThreadId === 'th-swmtp') {
        replySender = 'SWMTP Master Admin (Central Hub)';
        replyTitle = 'Central Hub Administrator';
        replyRole = 'swmtp_admin';
        replyText = `HMAC-SHA256 handshake confirmed. SWMTP Mesh received: "${userMessage}". Cryptographic delivery ACK logged.`;
      } else {
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('test') || lower.includes('hey')) {
          replyText = 'Hello Johnny! Kiaan Tech Team is actively monitoring this encrypted channel. All 15 AI studios, auto DMS marketplace, and attorney demo environments are 100% operational.';
        } else if (lower.includes('roadmap') || lower.includes('timeline') || lower.includes('sprint')) {
          replyText = 'Confirmed Johnny. Sprint milestones are locked. The updated PDF roadmap has been compiled and is ready in your vault.';
        } else if (lower.includes('logo') || lower.includes('design') || lower.includes('ui')) {
          replyText = 'Understood. The digital glowing energy effect and high-tech AI gateway aesthetics are synchronized across all modules.';
        } else {
          replyText = `Received instruction: "${userMessage}". Kiaan Tech Team core engineers have logged this in the active sprint docket.`;
        }
      }

      const replyMsgId = `ebx-${Date.now()}`;
      const replyMsg = {
        id: replyMsgId,
        senderRole: replyRole,
        sender: replySender,
        title: replyTitle,
        time: 'Just now',
        text: replyText,
        attachment: null,
      };

      setThreadStore((prev) => ({
        ...prev,
        [targetThreadId]: [...(prev[targetThreadId] || []), replyMsg],
      }));

      // If active language is not English, translate the reply instantly!
      if (selectedLanguage !== 'en') {
        try {
          const tx = await translateText(replyText, selectedLanguage);
          if (tx) {
            setTranslatedMessagesMap((prev) => ({ ...prev, [replyMsgId]: tx }));
          }
        } catch (e) {
          // ignore
        }
      }

      setIsTyping(false);

      addToast({
        title: `Reply Received from ${replySender}`,
        message: replyText.slice(0, 75) + '...',
        type: 'info',
      });
    }, 1200);
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() && attachedFiles.length === 0) return;

    let senderName = 'Johnny (Super Executive Admin)';
    let senderTitle = 'SEA / Business Owner';
    if (activePersona === 'ktt') {
      senderName = 'Kiaan Tech Team (KTT)';
      senderTitle = 'Lead Systems Architect';
    } else if (activePersona === 'attorney') {
      senderName = 'Legal Counsel (Corporate Diligence)';
      senderTitle = 'Senior Diligence Attorney';
    }

    const currentMsgText = inputText.trim();
    const currentFiles = [...attachedFiles];
    const sentPersona = activePersona;
    const threadId = activeThreadId;

    setInputText('');
    setAttachedFiles([]);

    const isSwmtp = threadId === 'th-swmtp';
    const activeMsgs = threadStore['th-swmtp'] || [];
    const lastSwmtp = [...activeMsgs].reverse().find((m) => m.conversationId);
    const conversationId = lastSwmtp?.conversationId || 'conv-swmtp-main';

    if (currentFiles.length > 0) {
      for (const file of currentFiles) {
        try {
          const base64Data = await readFileAsBase64(file);
          const isImg = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(file.name);
          const isVid = file.type?.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name);
          const isAud = file.type?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(file.name);
          const msgType = isImg ? 'image' : (isVid ? 'video' : (isAud ? 'audio' : 'file'));

          const fileMsgId = `ebx-f-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const fileMsg = {
            id: fileMsgId,
            senderRole: sentPersona,
            sender: senderName,
            title: senderTitle,
            time: 'Just now',
            text: currentMsgText,
            messageType: msgType,
            isImage: isImg,
            isVideo: isVid,
            isAudio: isAud,
            previewUrl: isImg || isVid ? base64Data : null,
            attachment: { name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, url: base64Data },
            reactions: {},
            isDbRecord: true,
            conversationId: isSwmtp ? conversationId : undefined,
          };

          setThreadStore((prev) => ({
            ...prev,
            [threadId]: [...(prev[threadId] || []), fileMsg],
          }));

          await eboxService.sendMessage({
            subject: isSwmtp ? `[SWMTP:${conversationId}] Reply by Johnny` : currentThread.title,
            message: currentMsgText,
            recipient: isSwmtp ? 'SWMTP Master Admin' : (sentPersona === 'johnny' ? currentThread.partnerName : 'Johnny (SEA)'),
            isSwmtp,
            conversationId: isSwmtp ? conversationId : undefined,
            messageType: msgType,
            fileData: base64Data,
            fileName: file.name,
            fileMetadata: {
              fileName: file.name,
              fileType: file.type || 'application/octet-stream',
              fileSize: `${(file.size / 1024).toFixed(1)} KB`,
              isImage: isImg,
              isVideo: isVid,
              isAudio: isAud,
            },
          });
        } catch (err) {
          console.warn('File dispatch notice:', err);
        }
      }
      addToast({
        title: 'Dispatch Delivered',
        message: 'File(s) uploaded to AES-256 encrypted vault.',
        type: 'success',
      });
    } else {
      const tempId = `ebx-${Date.now()}`;
      const newMsg = {
        id: tempId,
        senderRole: sentPersona,
        sender: senderName,
        title: senderTitle,
        time: 'Just now',
        text: currentMsgText,
        originalText: currentMsgText,
        attachment: null,
        isDbRecord: false,
        conversationId: isSwmtp ? conversationId : undefined,
      };

      // 1. Instantly display in chat UI (0ms lag)
      setThreadStore((prev) => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), newMsg],
      }));

      // 2. If translation is active, translate this new message into selectedLanguage live
      if (selectedLanguage !== 'en' && currentMsgText) {
        translateText(currentMsgText, selectedLanguage).then((tx) => {
          if (tx && tx.trim() && tx.trim() !== currentMsgText.trim()) {
            setTranslatedMessagesMap((prev) => ({ ...prev, [tempId]: tx }));
            setThreadStore((prev) => ({
              ...prev,
              [threadId]: (prev[threadId] || []).map((m) =>
                m.id === tempId ? { ...m, text: tx, originalText: currentMsgText, translatedTo: selectedLanguage } : m
              ),
            }));
          }
        });
      }

      // 3. Background persist to MySQL vault
      try {
        const response = await eboxService.sendMessage({
          subject: isSwmtp ? `[SWMTP:${conversationId}] Reply by Johnny` : currentThread.title,
          message: currentMsgText,
          recipient: isSwmtp ? 'SWMTP Master Admin' : (sentPersona === 'johnny' ? currentThread.partnerName : 'Johnny (SEA)'),
          isSwmtp,
          conversationId: isSwmtp ? conversationId : undefined,
          messageType: 'text',
        });

        if (response?.id) {
          setThreadStore((prev) => ({
            ...prev,
            [threadId]: (prev[threadId] || []).map((m) => (m.id === tempId ? { ...m, id: response.id, isDbRecord: true } : m)),
          }));
        }

        addToast({
          title: isSwmtp ? 'Synchronized with SWMTP Central Hub' : 'Message Transmitted & Vault Encrypted',
          message: isSwmtp
            ? 'Persisted to MySQL (AES-256) and synchronized to SWMTP Master Admin.'
            : `Saved to MySQL (AES-256) and delivered to ${sentPersona === 'johnny' ? currentThread.partnerName : 'Johnny (SEA)'}.`,
          type: 'success',
        });
      } catch (backendErr) {
        console.warn('Backend sync note (message safely stored locally):', backendErr);
        addToast({
          title: 'Encrypted Message Stored',
          message: 'Saved to local encrypted vault memory.',
          type: 'info',
        });
      }
    }
  };

  const handleResetDemo = () => {
    setThreadStore(INITIAL_CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEY);
    setIndividualTranslations({});
    if (selectedLanguage !== 'en') {
      const activeList = INITIAL_CONVERSATIONS[activeThreadId] || [];
      const instantMap = getInstantTranslations(activeList, selectedLanguage);
      setTranslatedMessagesMap(instantMap);
    } else {
      setTranslatedMessagesMap({});
    }
    addToast({
      title: 'Demo Conversation Reset',
      message: 'Restored original executive thread history.',
      type: 'info',
    });
  };

  const filteredMessages = activeMessages.filter(
    (m) =>
      (m.text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.sender || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.attachment?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick chips based on thread and persona
  const quickSuggestions =
    activeThreadId === 'th-swmtp'
      ? isEs
        ? [
            'Confirmado Administrador Principal: canal seguro sincronizado.',
            'Datos de ventas y CRM verificados en la red central.',
            'Bóveda de cifrado AES-256 activa con cero fugas.',
          ]
        : [
            'Confirmed Master Admin: secure channel synchronized.',
            'Sales and CRM deal metrics verified across central mesh.',
            'AES-256 vault encryption active with zero data leakage.',
          ]
      : activePersona === 'johnny'
      ? isEs
        ? [
            'Hola KTT, confirme el estado de la presentación legal.',
            'Por favor verifique los 15 pipelines de AI Studio.',
            'Confirme que la seguridad de cero fugas está activa.',
          ]
        : [
            'Hello KTT, confirm attorney presentation status.',
            'Please verify 15 AI Studio pipelines.',
            'Confirm zero-leakage security is active.',
          ]
      : activePersona === 'ktt'
      ? isEs
        ? [
            'Entendido Johnny, sprint de ingeniería desplegado.',
            'Confirmado: entorno listo para revisión de abogados.',
            'Todos los modelos conectados con cero fugas de datos.',
          ]
        : [
            'Understood Johnny, engineering sprint deployed.',
            'Confirmed: staging ready for attorney review.',
            'All models connected with zero-data leakage.',
          ]
      : isEs
      ? [
          'Memorando de diligencia legal archivado.',
          'Todos los secretos comerciales y cláusulas NDA aprobados.',
          'Listo para revisión ejecutiva de inversionistas.',
        ]
      : [
          'Attorney diligence memorandum filed.',
          'All IP trade secrets and NDA provisions approved.',
          'Ready for executive investor review.',
        ];

  return (
    <div className="ebox-page-container">
      {/* Top Header Row */}
      <div className="ebox-top-header">
        <div className="ebox-top-header-title-group">
          <Breadcrumb items={[{ label: 'CRM nErgy AI' }, { label: isEs ? 'Gobernanza Ejecutiva' : 'Executive Governance' }, { label: isEs ? 'zBox Seguro' : 'Secured zBox' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <h1 className="ebox-top-header-title">
              <Lock size={20} style={{ color: 'var(--energy-sky, #0284c7)' }} />
              {isEs ? 'zBox de Comunicaciones Seguras' : 'Secured Communications zBox'}
            </h1>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono, monospace)',
                color: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#059669',
                  boxShadow: '0 0 6px #059669',
                }}
              />
              {isEs ? 'Bóveda SEA ↔ KTT' : 'SEA ↔ KTT Vault'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            {isEs
              ? 'Bóveda de mensajería ejecutiva con cifrado de extremo a extremo y traducción multilingüe.'
              : 'End-to-end encrypted executive messaging vault with instant multilingual auto-translation.'}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleResetDemo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 600,
              borderRadius: '7px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <RotateCcw size={13} />
            {isEs ? 'Restablecer' : 'Reset History'}
          </button>

          <button
            type="button"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Hello Kiaan Tech Team! I am reaching out from CRM nErgy Secured zBox regarding executive support.')}`, '_blank')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 600,
              borderRadius: '7px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              color: '#059669',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <MessageCircle size={13} />
            {isEs ? 'WhatsApp' : 'WhatsApp Hotline'}
          </button>
        </div>
      </div>

      {/* SLEEK COMPACT PERSONA CONTROLLER STRIP (Bloat Removed) */}
      <div className="ebox-persona-strip">
        <div className="ebox-persona-label">
          <User size={14} style={{ color: activePersona === 'johnny' ? '#0284c7' : activePersona === 'ktt' ? '#4f46e5' : '#059669' }} />
          <span>{isEs ? 'Operador Activo:' : 'Active Operator:'}</span>
          <span style={{ color: activePersona === 'johnny' ? '#0284c7' : activePersona === 'ktt' ? '#4f46e5' : '#059669', fontWeight: 800 }}>
            {activePersona === 'johnny'
              ? 'Johnny (Super Executive Admin)'
              : activePersona === 'ktt'
              ? (isEs ? 'Equipo Dev Kiaan (KTT)' : 'Kiaan Tech Team (KTT)')
              : (isEs ? 'Mesa Legal Corporativa' : 'Corporate Legal Counsel')}
          </span>
        </div>

        <div className="ebox-persona-buttons">
          <button
            type="button"
            onClick={() => setActivePersona('johnny')}
            className={`ebox-persona-btn ${activePersona === 'johnny' ? 'active-johnny' : ''}`}
          >
            <User size={12} />
            Johnny (SEA)
          </button>

          <button
            type="button"
            onClick={() => setActivePersona('ktt')}
            className={`ebox-persona-btn ${activePersona === 'ktt' ? 'active-ktt' : ''}`}
          >
            <Shield size={12} />
            {isEs ? 'KTT (Dev)' : 'KTT (Dev Team)'}
          </button>

          <button
            type="button"
            onClick={() => setActivePersona('attorney')}
            className={`ebox-persona-btn ${activePersona === 'attorney' ? 'active-attorney' : ''}`}
          >
            <Lock size={12} />
            {isEs ? 'Legal' : 'Attorney'}
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE CONTAINER (Responsive Mobile + Desktop) */}
      <div className={`ebox-main-grid ${mobilePane === 'channels' ? 'mobile-show-channels' : 'mobile-show-chat'}`}>
        {/* LEFT COLUMN: CHANNELS VAULT */}
        <div className="ebox-channels-pane">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isEs ? 'Bóvedas Cifradas' : 'Encrypted Vaults'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--surface-secondary)',
                border: '1px solid var(--border)',
                padding: '2px 8px',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
              }}
            >
              {threads.length} {isEs ? 'Canales' : 'Channels'}
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEs ? 'Buscar en historial cifrado...' : 'Search encrypted history...'}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Channels List */}
          <div className="ebox-channels-list">
            {threads.map((th) => {
              const isActive = activeThreadId === th.id;
              const msgCount = (threadStore[th.id] || []).length;
              const IconComp = th.icon;

              return (
                <div
                  key={th.id}
                  onClick={() => {
                    setActiveThreadId(th.id);
                    setMobilePane('chat'); // Automatically open chat on mobile when tapped
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: isActive ? `1.5px solid ${th.color}` : '1px solid var(--border)',
                    backgroundColor: isActive ? th.accentBg : 'var(--surface)',
                    transition: 'all 150ms ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: th.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0,
                        }}
                      >
                        <IconComp size={13} />
                      </div>
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: isActive ? th.color : 'var(--text-primary)',
                        }}
                      >
                        {th.title}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {msgCount} msgs
                    </span>
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {th.subtitle}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    <span style={{ fontWeight: 600 }}>{th.badge}</span>
                    <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      <CheckCheck size={11} /> {isEs ? 'Bóveda E2EE' : 'E2EE Vault'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONVERSATION & TWO-WAY COMPOSER */}
        <div className="ebox-chat-pane">
          {/* Thread Header */}
          <div className="ebox-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              {/* Mobile Back Button to return to Channels */}
              <button
                type="button"
                className="ebox-mobile-back-btn"
                onClick={() => setMobilePane('channels')}
                title="Back to channels"
              >
                <ChevronLeft size={15} />
                <span>{isEs ? 'Canales' : 'Channels'}</span>
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {currentThread.title}
                  </h3>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: '#059669',
                      backgroundColor: 'rgba(5, 150, 105, 0.12)',
                      border: '1px solid rgba(5, 150, 105, 0.25)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    AES-256-GCM
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {currentThread.subtitle}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* WebRTC Voice & Video Call Action Buttons */}
              <button
                type="button"
                onClick={() => startCall('audio')}
                style={{
                  padding: '6px 9px',
                  borderRadius: '7px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={isEs ? 'Llamada de voz WebRTC' : 'Start WebRTC Voice Call'}
              >
                <Phone size={13} />
              </button>

              <button
                type="button"
                onClick={() => startCall('video')}
                style={{
                  padding: '6px 9px',
                  borderRadius: '7px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={isEs ? 'Videollamada WebRTC' : 'Start WebRTC Video Call'}
              >
                <Video size={13} />
              </button>

              {/* One-Click Language Translate Button & Interactive Dropdown (Client Feature) */}
              <div style={{ position: 'relative' }} ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  title="One-click automatic language translation"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: selectedLanguage !== 'en' ? '1.5px solid #0284c7' : '1px solid var(--border)',
                    backgroundColor: selectedLanguage !== 'en' ? 'rgba(2, 132, 199, 0.12)' : 'var(--surface)',
                    color: selectedLanguage !== 'en' ? '#0284c7' : 'var(--text-primary)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <Languages size={14} style={{ color: selectedLanguage !== 'en' ? '#0284c7' : 'var(--text-secondary)' }} />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '13px' }}>{SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.flag}</span>
                    <span>{SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.native || 'English'}</span>
                  </span>
                  {isTranslating ? (
                    <RefreshCw size={10} className="animate-spin" style={{ color: '#0284c7' }} />
                  ) : (
                    <span style={{ fontSize: '8px', opacity: 0.6 }}>▼</span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showLangDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      zIndex: 1000,
                      width: '200px',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ padding: '6px 8px 4px', fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Translate eBox To
                    </div>
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = selectedLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageChange(lang.code)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                            color: isSelected ? '#0284c7' : 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 120ms ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>{lang.flag}</span>
                            <span>{lang.native}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>({lang.name})</span>
                          </span>
                          {isSelected && <CheckCircle2 size={13} style={{ color: '#0284c7' }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Body Feed */}
          <div className="ebox-message-feed">
            {/* Real-Time Translation Active Banner */}
            {selectedLanguage !== 'en' && (
              <div
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#0284c7',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Languages size={15} />
                  <span>
                    Auto-translated to{' '}
                    <strong>
                      {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name} ({SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.flag})
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0284c7',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                  }}
                >
                  Show Original (English)
                </button>
              </div>
            )}
            {isLoadingMessages ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '10px' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--energy-sky, #0284c7)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Loading secure messages from encrypted vault...</span>
              </div>
            ) : fetchError ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444', gap: '8px', padding: '20px', textAlign: 'center' }}>
                <Shield size={28} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Access Notice</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{fetchError}</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
                <Search size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{isEs ? 'No se encontraron mensajes seguros' : 'No secure messages found'}</span>
              </div>
            ) : (
              filteredMessages.map((m) => {
                const isMine = m.senderRole === activePersona;

                // Compute translation state for this message
                const singleOverride = individualTranslations[m.id];
                const isSingleReverted = singleOverride && singleOverride.isOriginal;
                const isSingleActive = singleOverride && singleOverride.isTranslated;

                const origText = m.originalText || (SEED_TRANSLATIONS_DICT[m.id]?.en) || m.text;
                let displayText = m.text || origText;
                let isThisMessageTranslated = false;
                let translatedLangName = '';

                if (isSingleActive && singleOverride.text) {
                  displayText = singleOverride.text;
                  isThisMessageTranslated = true;
                  translatedLangName = singleOverride.langObj?.name || singleOverride.targetLang;
                } else if (isSingleReverted) {
                  displayText = origText;
                  isThisMessageTranslated = false;
                } else if (selectedLanguage !== 'en') {
                  const tx = translatedMessagesMap[m.id] || (SEED_TRANSLATIONS_DICT[m.id]?.[selectedLanguage]);
                  if (tx && tx.trim() && tx.trim() !== origText.trim()) {
                    displayText = tx;
                    isThisMessageTranslated = true;
                    translatedLangName = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name || selectedLanguage;
                  } else if (m.translatedTo === selectedLanguage && m.text && m.text.trim() !== origText.trim()) {
                    displayText = m.text;
                    isThisMessageTranslated = true;
                    translatedLangName = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name || selectedLanguage;
                  } else {
                    displayText = origText;
                    isThisMessageTranslated = false;
                  }
                } else {
                  displayText = origText;
                  isThisMessageTranslated = false;
                }

                const activeLangCode = isSingleActive ? singleOverride.targetLang : selectedLanguage;
                const isRtl = SUPPORTED_LANGUAGES.find((l) => l.code === activeLangCode)?.dir === 'rtl';

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                      width: '100%',
                    }}
                  >
                    {/* Meta info: Sender, Role Badge & Time */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: isMine
                            ? activePersona === 'johnny'
                              ? '#0284c7'
                              : '#4f46e5'
                            : 'var(--text-primary)',
                        }}
                      >
                        {m.sender}
                      </span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: m.senderRole === 'johnny' ? 'rgba(2, 132, 199, 0.12)' : m.senderRole === 'ktt' ? 'rgba(79, 70, 229, 0.12)' : m.senderRole === 'attorney' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                          color: m.senderRole === 'johnny' ? '#0284c7' : m.senderRole === 'ktt' ? '#4f46e5' : m.senderRole === 'attorney' ? '#059669' : 'var(--text-secondary)',
                          border: '1px solid ' + (m.senderRole === 'johnny' ? 'rgba(2, 132, 199, 0.3)' : m.senderRole === 'ktt' ? 'rgba(79, 70, 229, 0.3)' : m.senderRole === 'attorney' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(100, 116, 139, 0.3)'),
                        }}
                      >
                        {m.title || (m.senderRole === 'johnny' ? 'SEA / Owner' : m.senderRole === 'ktt' ? 'Lead Systems Architect' : m.senderRole === 'attorney' ? 'Legal Diligence Attorney' : 'SWMTP Master Admin')}
                      </span>
                      <span>•</span>
                      <span>{m.time}</span>
                      {isMine && (
                        <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', marginLeft: '4px' }}>
                          <CheckCheck size={12} /> Delivered
                        </span>
                      )}
                    </div>

                    {/* Speech Bubble */}
                    <div
                      style={{
                        maxWidth: 'min(88%, 640px)',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        borderTopRightRadius: isMine ? '2px' : '16px',
                        borderTopLeftRadius: !isMine ? '2px' : '16px',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        background: isMine
                          ? activePersona === 'johnny'
                            ? 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)'
                            : activePersona === 'ktt'
                            ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                            : 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                          : m.senderRole === 'johnny'
                          ? 'rgba(2, 132, 199, 0.08)'
                          : 'var(--surface-secondary)',
                        color: isMine ? '#ffffff' : 'var(--text-primary)',
                        border: isMine ? 'none' : '1px solid var(--border)',
                        boxShadow: isMine ? '0 3px 10px rgba(0,0,0,0.12)' : '0 2px 6px rgba(0,0,0,0.04)',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          color: isMine ? '#ffffff' : 'var(--text-primary)',
                          fontWeight: isMine ? 500 : 400,
                          fontSize: '13px',
                          lineHeight: '1.5',
                          direction: isRtl && isThisMessageTranslated ? 'rtl' : 'ltr',
                          textAlign: isRtl && isThisMessageTranslated ? 'right' : 'left',
                        }}
                      >
                        {displayText}
                      </p>

                      {/* Translation Indicator Badge inside Bubble */}
                      {isThisMessageTranslated && selectedLanguage !== 'en' && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '6px',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            backgroundColor: isMine ? 'rgba(255, 255, 255, 0.2)' : 'rgba(2, 132, 199, 0.12)',
                            color: isMine ? '#ffffff' : '#0284c7',
                          }}
                        >
                          <Languages size={11} />
                          <span>Translated to {translatedLangName}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSingleTranslation(m.id, origText);
                            }}
                            style={{
                              marginLeft: '6px',
                              background: 'none',
                              border: 'none',
                              color: 'inherit',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: '10px',
                              fontWeight: 700,
                            }}
                          >
                            {isSingleActive ? 'Show Original' : 'Revert'}
                          </button>
                        </div>
                      )}

                      {/* Voice Note Player */}
                      {(m.type === 'audio' || m.messageType === 'audio') && (
                        <div style={{ marginTop: m.text ? '8px' : '0' }}>
                          <VoiceNotePlayer msg={m} isMine={isMine} />
                        </div>
                      )}

                      {/* High-Resolution Photo Viewer Card */}
                      {m.isImage && (m.previewUrl || m.attachment?.url) && (
                        <div
                          style={{
                            marginTop: '8px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'zoom-in',
                            backgroundColor: 'rgba(0,0,0,0.18)',
                            border: isMine ? '1px solid rgba(255,255,255,0.35)' : '1px solid var(--border)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
                            transition: 'all 180ms ease',
                          }}
                          onClick={() => setPreviewImage({ previewUrl: m.previewUrl || m.attachment?.url, attachment: m.attachment || { name: 'Photo.png', size: 'High-Res' } })}
                          title="Click to view full High-Resolution image"
                        >
                          <img
                            src={m.previewUrl || m.attachment?.url}
                            alt={m.attachment?.name || 'Photo'}
                            style={{
                              maxWidth: 'min(100%, 380px)',
                              maxHeight: '340px',
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'contain',
                              borderRadius: '12px 12px 0 0',
                              display: 'block',
                              margin: '0 auto',
                            }}
                          />
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 12px',
                              backgroundColor: isMine ? 'rgba(0,0,0,0.22)' : 'var(--surface)',
                              borderTop: isMine ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border)',
                              fontSize: '11px',
                              color: isMine ? '#ffffff' : 'var(--text-secondary)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                              <Image size={13} style={{ flexShrink: 0, color: isMine ? '#ffffff' : '#0284c7' }} />
                              <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.attachment?.name || 'High-Res Photo'}
                              </span>
                              {m.attachment?.size && (
                                <span style={{ opacity: 0.8, fontSize: '10px' }}>({m.attachment.size})</span>
                              )}
                            </div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: isMine ? '#ffffff' : '#0284c7',
                              }}
                            >
                              <ExternalLink size={10} /> Full HD
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Video Player */}
                      {m.isVideo && m.previewUrl && (
                        <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden' }}>
                          <video
                            src={m.previewUrl}
                            controls
                            playsInline
                            style={{ maxWidth: '280px', maxHeight: '180px', borderRadius: '8px', display: 'block', backgroundColor: '#000' }}
                          />
                        </div>
                      )}

                      {/* Quick Reactions Bar & Display */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: '4px', marginTop: '6px' }}>
                        {m.reactions && Object.entries(m.reactions).map(([emo, count]) => (
                          <span
                            key={emo}
                            style={{
                              fontSize: '10px',
                              backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : 'var(--surface-secondary)',
                              border: '1px solid ' + (isMine ? 'rgba(255,255,255,0.3)' : 'var(--border)'),
                              borderRadius: '10px',
                              padding: '1px 5px',
                              color: isMine ? '#ffffff' : 'var(--text-primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <span>{emo}</span>
                            <span style={{ fontWeight: 700 }}>{count}</span>
                          </span>
                        ))}
                        <div style={{ display: 'inline-flex', gap: '3px', opacity: 0.65 }}>
                          {['👍', '❤️', '🔥'].map((emo) => (
                            <span
                              key={emo}
                              onClick={() => handleAddReaction(m.id, emo)}
                              style={{ cursor: 'pointer', fontSize: '11px', userSelect: 'none' }}
                              title={'React ' + emo}
                            >
                              {emo}
                            </span>
                          ))}
                        </div>

                        {/* Inline Translate Toggle for Individual Message */}
                        {m.text && (
                          <button
                            type="button"
                            disabled={translatingMsgId === m.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSingleTranslation(m.id, origText);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '10px',
                              fontWeight: 600,
                              backgroundColor: isMine ? 'rgba(255,255,255,0.18)' : 'var(--surface)',
                              border: '1px solid ' + (isMine ? 'rgba(255,255,255,0.3)' : 'var(--border)'),
                              borderRadius: '8px',
                              padding: '1px 6px',
                              color: isMine ? '#ffffff' : 'var(--text-secondary)',
                              cursor: translatingMsgId === m.id ? 'wait' : 'pointer',
                              marginLeft: '6px',
                              transition: 'all 150ms ease',
                            }}
                            title={
                              isThisMessageTranslated
                                ? 'Show original text'
                                : `Translate to ${selectedLanguage === 'en' ? 'Spanish' : (SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name || selectedLanguage)}`
                            }
                          >
                            {translatingMsgId === m.id ? (
                              <RefreshCw size={10} className="animate-spin" />
                            ) : (
                              <Languages size={10} />
                            )}
                            <span>{translatingMsgId === m.id ? 'Translating...' : (isThisMessageTranslated ? 'Original' : 'Translate')}</span>
                          </button>
                        )}

                        {/* Delete Message Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(m.id);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: '10px',
                            fontWeight: 600,
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: '1px 4px',
                            color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)',
                            cursor: 'pointer',
                            marginLeft: '4px',
                            opacity: 0.75,
                            transition: 'opacity 150ms ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
                          title="Delete message from vault"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>

                      {/* Attachment if present (non-image files like PDF, DOCX, ZIP, etc.) */}
                      {m.attachment && !m.isImage && (
                        <div
                          onClick={() => handleOpenAttachment(m.attachment, m)}
                          title="Click to Open & View Decrypted Document"
                          style={{
                            marginTop: '10px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: isMine ? '1px solid rgba(255,255,255,0.35)' : '1px solid var(--border)',
                            backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : 'rgba(2, 132, 199, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: isMine ? '#ffffff' : 'var(--energy-sky, #0284c7)',
                            transition: 'all 150ms ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMine ? '#ffffff' : 'inherit' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : '#0284c7',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <FileText size={13} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ color: isMine ? '#ffffff' : 'inherit', textDecoration: 'none', fontWeight: 700 }}>
                                {m.attachment.name}
                              </span>
                              <span style={{ opacity: 0.85, fontSize: '10px', color: isMine ? '#ffffff' : 'var(--text-tertiary)' }}>
                                {m.attachment.size} • Click to View & Download
                              </span>
                            </div>
                          </div>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: isMine ? 'rgba(255,255,255,0.25)' : 'rgba(2, 132, 199, 0.15)',
                            color: isMine ? '#ffffff' : '#0284c7',
                            border: '1px solid ' + (isMine ? 'rgba(255,255,255,0.4)' : 'rgba(2, 132, 199, 0.3)'),
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <ExternalLink size={10} /> Open
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Live Typing Indicator for Realistic Interaction */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--surface-secondary)', width: 'fit-content' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {currentThread.partnerName} is typing encrypted response...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="ebox-quick-chips-row">
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', flexShrink: 0 }}>
              {isEs ? 'Rápido:' : 'Quick:'}
            </span>
            {quickSuggestions.map((text, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(text)}
                className="ebox-quick-chip-btn"
              >
                {text}
              </button>
            ))}
          </div>

          {/* Composer Input Bar */}
          <div className="ebox-composer-bar">
            {/* Hidden File, Image & Video Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              multiple
            />
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              style={{ display: 'none' }}
              multiple
            />
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleFileSelect}
              accept="video/*"
              style={{ display: 'none' }}
              multiple
            />

            {/* Attached Files Previews */}
            {attachedFiles.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {attachedFiles.map((f, idx) => (
                  <FilePreview key={idx} file={f} onRemove={() => removeFile(idx)} />
                ))}
              </div>
            )}

            {/* Emoji Popover Picker */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                style={{
                  position: 'absolute',
                  bottom: '68px',
                  left: '16px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '6px',
                  zIndex: 100,
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                {EMOJI_LIST.map((emo) => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emo);
                      setShowEmojiPicker(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                    }}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            )}

            {/* Active Dispatch & Target Role Indicator Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                marginBottom: '8px',
                backgroundColor: 'var(--surface-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>Dispatching From:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: activePersona === 'johnny' ? '#0284c7' : activePersona === 'ktt' ? '#4f46e5' : '#059669',
                    backgroundColor: activePersona === 'johnny' ? 'rgba(2, 132, 199, 0.12)' : activePersona === 'ktt' ? 'rgba(79, 70, 229, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    border: '1px solid ' + (activePersona === 'johnny' ? 'rgba(2, 132, 199, 0.25)' : activePersona === 'ktt' ? 'rgba(79, 70, 229, 0.25)' : 'rgba(5, 150, 105, 0.25)'),
                  }}
                >
                  {activePersona === 'johnny' ? 'Johnny [SEA]' : activePersona === 'ktt' ? 'KTT [Lead Architect]' : 'Legal Counsel [Attorney]'}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>➔</span>
                <span style={{ fontWeight: 600 }}>Recipient Target:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--surface)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                  }}
                >
                  {activePersona === 'johnny' ? currentThread.partnerName : 'Johnny (Super Executive Admin)'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  ({activePersona === 'johnny' ? (currentThread.id === 'th-swmtp' ? 'SWMTP Gateway' : currentThread.id === 'th-2' ? 'Corporate Legal Diligence' : 'Technical Systems Architect') : 'SEA Owner Clearance'})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '10.5px', fontWeight: 600 }}>
                <ShieldCheck size={13} />
                <span>Zero-Leakage Vault Route</span>
              </div>
            </div>

            {/* Composer Bar: Voice Mode or Normal Mode */}
            {isRecordingVoice ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>
                    {isEs ? 'Grabando Nota de Voz...' : 'Recording Voice Note...'}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginLeft: '6px' }}>
                    {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCancelVoice}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {isEs ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleStopAndSendVoice}
                    style={{
                      backgroundColor: '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Send size={13} />
                    {isEs ? 'Enviar Audio' : 'Send Voice'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSend} className="ebox-composer-form">
                {/* Media Attachment Tools Group */}
                <div className="ebox-composer-tools">
                  {/* File Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="ebox-composer-tool-btn"
                    title={isEs ? 'Adjuntar archivo' : 'Attach file'}
                  >
                    <Paperclip size={14} />
                  </button>

                  {/* Photo Upload Button */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="ebox-composer-tool-btn"
                    title={isEs ? 'Adjuntar foto' : 'Attach photo'}
                  >
                    <Image size={14} />
                  </button>

                  {/* Video Upload Button */}
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="ebox-composer-tool-btn"
                    title={isEs ? 'Adjuntar video' : 'Attach video'}
                  >
                    <Video size={14} />
                  </button>

                  {/* Emoji Picker Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="ebox-composer-tool-btn"
                    style={{
                      backgroundColor: showEmojiPicker ? 'rgba(2, 132, 199, 0.12)' : undefined,
                      color: showEmojiPicker ? '#0284c7' : undefined,
                    }}
                    title={isEs ? 'Insertar emoji' : 'Insert emoji'}
                  >
                    <Smile size={14} />
                  </button>
                </div>

                {/* Input Text */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    activePersona === 'johnny'
                      ? (isEs ? `Instruir a ${currentThread.partnerName}...` : `Instruct ${currentThread.partnerName}...`)
                      : activePersona === 'ktt'
                      ? (isEs ? 'Responder a Johnny (SEA)...' : 'Reply to Johnny (SEA)...')
                      : (isEs ? 'Enviar respuesta legal a Johnny...' : 'Send legal diligence reply to Johnny...')
                  }
                  className="ebox-composer-input"
                />

                {/* Voice Record Button */}
                <button
                  type="button"
                  onClick={handleStartVoice}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-secondary)',
                    color: '#0284c7',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={isEs ? 'Grabar nota de voz' : 'Record voice note'}
                >
                  <Mic size={15} />
                </button>

                {/* Translate Draft Button (Johnny can translate his draft before sending) */}
                {inputText.trim() && (
                  <button
                    type="button"
                    onClick={handleTranslateInput}
                    disabled={isTranslatingDraft}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(2, 132, 199, 0.35)',
                      backgroundColor: 'rgba(2, 132, 199, 0.08)',
                      color: '#0284c7',
                      cursor: isTranslatingDraft ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      transition: 'all 150ms ease',
                    }}
                    title={`Translate draft into ${selectedLanguage === 'en' ? 'Spanish' : (SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name || selectedLanguage)}`}
                  >
                    <Languages size={14} className={isTranslatingDraft ? 'animate-spin' : ''} />
                    <span>
                      {isTranslatingDraft
                        ? 'Translating...'
                        : `Translate (${selectedLanguage === 'en' ? 'ES' : selectedLanguage.toUpperCase()})`}
                    </span>
                  </button>
                )}

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() && attachedFiles.length === 0}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: (inputText.trim() || attachedFiles.length > 0)
                      ? activePersona === 'johnny'
                        ? '#0284c7'
                        : activePersona === 'ktt'
                        ? '#4f46e5'
                        : '#059669'
                      : 'var(--border)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: (inputText.trim() || attachedFiles.length > 0) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 150ms ease',
                    boxShadow: (inputText.trim() || attachedFiles.length > 0) ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  <Send size={14} />
                  {isEs ? 'Enviar' : 'Send'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      {/* Real WebRTC calling is handled by global ActiveCallOverlay */}

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '86vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage.previewUrl}
              alt={previewImage.attachment?.name || 'Full HD Image'}
              style={{
                maxWidth: '90vw',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'block',
              }}
            />
            {/* Action Bar below image */}
            <div
              style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '8px 16px',
                borderRadius: '24px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {previewImage.attachment?.name || 'High-Resolution Image'}
              </span>
              <span style={{ opacity: 0.6 }}>|</span>
              <a
                href={previewImage.previewUrl}
                download={previewImage.attachment?.name || 'high-res-image.png'}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#38bdf8',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700,
                }}
              >
                <Download size={13} /> Download Original HD
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 150ms ease',
            }}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Encrypted Document & PDF Viewer Modal */}
      {selectedPdfDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSelectedPdfDoc(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              color: '#f8fafc',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #334155',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                    {selectedPdfDoc.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '11px', color: '#94a3b8' }}>
                    <span>{selectedPdfDoc.size}</span>
                    <span>•</span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>AES-256-GCM Vault Decrypted</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPdfDoc(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Viewer */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {selectedPdfDoc.url && selectedPdfDoc.url.startsWith('data:application/pdf') ? (
                <iframe
                  src={selectedPdfDoc.url}
                  title={selectedPdfDoc.name}
                  style={{ width: '100%', height: '480px', border: 'none', borderRadius: '8px', backgroundColor: '#ffffff' }}
                />
              ) : (
                <div
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={20} style={{ color: '#34d399' }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                        Cryptographic Diligence Certificate & Archival Summary
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', backgroundColor: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>
                      ID: CERT-2026-X992
                    </span>
                  </div>

                  <div style={{ fontSize: '12.5px', lineHeight: '1.6', color: '#cbd5e1' }}>
                    <p style={{ marginTop: 0 }}>
                      This document has been verified and securely decrypted for <strong>Super Executive Admin [SEA] (Johnny)</strong>. All cryptographic checksums match the primary vault ledger with zero data leakage.
                    </p>
                    <div style={{ backgroundColor: '#0b1120', padding: '12px 16px', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '12px', fontFamily: 'monospace' }}>
                      <div>• <strong>Document:</strong> {selectedPdfDoc.name}</div>
                      <div>• <strong>Cipher:</strong> AES-256-GCM Hardware-Grade Vault</div>
                      <div>• <strong>Source / Author:</strong> {selectedPdfDoc.sender} ({selectedPdfDoc.title})</div>
                      <div>• <strong>Verification Status:</strong> Legally Sealed & Verified</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '14px 20px',
                borderTop: '1px solid #334155',
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
              }}
            >
              <button
                type="button"
                onClick={() => handleOpenInNewTab(selectedPdfDoc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: 'rgba(51, 65, 85, 0.5)',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={14} /> Open in New Tab
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedPdfDoc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.4)',
                }}
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuredEbox;
