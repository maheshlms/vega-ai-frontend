import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { IoClose, IoPause, IoPlay, IoStop } from "react-icons/io5";
import { FaArrowLeft, FaMicrophone, FaPaperPlane, FaTrash } from "react-icons/fa";
import { IoAttachOutline } from "react-icons/io5";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  TaskMode,
} from '@heygen/streaming-avatar';
import api from '../../utils/api';
import { auth } from '../../utils/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  files?: string[];
  isError?: boolean;
  isSuccess?: boolean;
  file_path?: string;
  filename?: string;
  metadata?: {
    type?: string;
    csr_content?: string;
    keypair_id?: string;
    filename?: string;
    [key: string]: any;
  };
}

interface Agent {
  id?: string;
  name?: string;
  role?: string;
  description?: string;
  type?: string;
  config?: {
    environment?: string;
    selectedAvatarImg?: string;
    selectedAvatarName?: string;
    selectedAvatarId?: string;
  };
}

interface PendingApproval {
  approval_id: string;
  filename: string;
  expires_at?: string;
  session_id?: string;
  action_type?: string; // e.g. 'update_ssl_certificate' | 'update_license'
}

interface FileData {
  name: string;
  type: string;
  data: string;
}

interface ChatHistory {
  [key: string]: string;
}

// Speech Recognition types
interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; resultIndex: number; }
interface SpeechRecognitionErrorEvent extends Event { error: string; }
interface SpeechRecognitionResultList { length: number; [i: number]: SpeechRecognitionResult; }
interface SpeechRecognitionResult { [i: number]: SpeechRecognitionAlternative; isFinal: boolean; }
interface SpeechRecognitionAlternative { transcript: string; }
interface SpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
interface SpeechRecognitionConstructor { new(): SpeechRecognition; }
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const KNOWN_STREAMING_AVATARS: Record<string, string[]> = {
  marianne:   ['Marianne_ProfessionalLook_public', 'marianne_front_public'],
  katya:      ['Katya_ProfessionalLook_public', 'katya_front_public'],
  alessandra: ['Alessandra_ProfessionalLook_public'],
  tyler:      ['Tyler-incasualsuit-20220722', 'Tyler_ProfessionalLook_public'],
  anna:       ['Anna_public_3_20240108', 'Anna_ProfessionalLook_public'],
  eric:       ['Eric_public_pro1_20230608', 'Eric_ProfessionalLook_public'],
  susan:      ['Susan_public_2_20240328', 'Susan_ProfessionalLook_public'],
  josh:       ['Josh_lite_20230714', 'Josh_ProfessionalLook_public'],
  shelly:     ['Shelly_public_20240408'],
  wayne:      ['Wayne_20240711_public'],
};

const DEFAULT_STREAMING_AVATAR = 'Marianne_ProfessionalLook_public';

// ─── Avatar Image with fallback ───────────────────────────────────────────────
interface AvatarImgProps {
  src?: string;
  name?: string;
  size: number;
  className?: string;
}
const AvatarImg: React.FC<AvatarImgProps> = ({ src, name = 'A', size, className = '' }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center text-white font-bold rounded-full flex-shrink-0 ${className}`}
        style={{
          width: size, height: size, fontSize: size * 0.4,
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
        }}
      >
        {(name[0] ?? 'A').toUpperCase()}
      </div>
    );
  }
  return (
    <img src={src} alt={name}
      className={`object-cover object-top rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AgentChat: React.FC = () => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const location = useLocation();
  const preloadedAgent = location.state?.agent;

  // ── Agent state ───────────────────────────────────────────────────────────
  const [agent, setAgent] = useState<Agent | null>(preloadedAgent || null);
  const [agentError, setAgentError] = useState<string>('');
  const [loadingAgent, setLoadingAgent] = useState<boolean>(!preloadedAgent);

  // ── Chat state ────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});
  const [showWelcomeMessage, setShowWelcomeMessage] = useState<boolean>(true);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [approvalProcessing, setApprovalProcessing] = useState<boolean>(false);
  const [approvalClickedAction, setApprovalClickedAction] = useState<'approve' | 'reject' | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);

  // ── Avatar (HeyGen Streaming SDK) state ───────────────────────────────────
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isAvatarActive, setIsAvatarActive] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [resolvedAvatarId, setResolvedAvatarId] = useState<string>('');
  const [debugLines, setDebugLines] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [autoSendVoice, setAutoSendVoice] = useState(false);

  // ── Voice input state ─────────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarRef = useRef<InstanceType<typeof StreamingAvatar> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chromaRafRef = useRef<number | null>(null);
  const hasSpokenInit = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioTracksRef = useRef<MediaStreamTrack[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const latestAIResponseRef = useRef<string>('');

  // ── Derived avatar info ───────────────────────────────────────────────────
  const avatarImg  = agent?.config?.selectedAvatarImg  || (agent as any)?.avatarImg  || '';
  const avatarName = agent?.config?.selectedAvatarName || (agent as any)?.avatarName || agent?.name || 'Agent';
  const avatarId   = agent?.config?.selectedAvatarId   || '';

  const avatarIdRef = useRef(avatarId);
  useEffect(() => { avatarIdRef.current = avatarId; }, [avatarId]);

  // ── Scroll ────────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  // ── Always fetch full agent from API ──────────────────────────────────────
  useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId || agentId.startsWith('default-')) { setLoadingAgent(false); return; }
      try {
        const data = await api.llmRuntime.getAgent(agentId);
        setAgent(data);
      } catch (err) {
        console.error('Failed to load agent details', err);
        setAgentError('Unable to load agent details');
        if (preloadedAgent) setAgent(preloadedAgent);
      } finally { setLoadingAgent(false); }
    };
    fetchAgent();
  }, [agentId]); // eslint-disable-line

  // ── Debug logger ──────────────────────────────────────────────────────────
  const log = useCallback((msg: string) => {
    console.log('[AgentChat Avatar]', msg);
    setDebugLines(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev].slice(0, 20));
  }, []);

  // ── Audio management ──────────────────────────────────────────────────────
  const rebuildAudio = useCallback(() => {
    if (!audioTracksRef.current.length) return;
    if (!audioElRef.current) {
      audioElRef.current = new Audio();
      audioElRef.current.autoplay = true;
      audioElRef.current.volume = 1.0;
    }
    audioElRef.current.srcObject = new MediaStream(audioTracksRef.current);
    audioElRef.current.play()
      .then(() => { setAudioBlocked(false); log('🔊 Audio playing'); })
      .catch(err => { log(`⚠️ Autoplay blocked: ${err.message}`); setAudioBlocked(true); });
  }, [log]);

  const handleUnmuteAudio = useCallback(() => {
    audioElRef.current?.play().then(() => setAudioBlocked(false)).catch(console.error);
  }, []);

  const handleMuteToggle = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (audioElRef.current) {
      audioElRef.current.volume = newMuted ? 0 : 1.0;
    }
  }, [muted]);

  // ── Fetch session token ───────────────────────────────────────────────────
  const fetchSessionToken = async (): Promise<string> => {
    const apiKey = import.meta.env.VITE_HEYGEN_API_KEY;
    if (!apiKey) throw new Error('NO_API_KEY');

    const headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };
    const parseToken = (data: any): string | null =>
      data?.data?.token ?? data?.token ?? data?.data?.access_token ?? data?.access_token ?? null;

    for (const endpoint of ['/heygen-api/v1/streaming.create_token', '/heygen-api/v1/realtime.token']) {
      try {
        log(`Fetching token from ${endpoint}…`);
        const r = await fetch(endpoint, { method: 'POST', headers });
        const text = await r.text();
        if (!r.ok) {
          if (r.status === 401) throw new Error('INVALID_API_KEY');
          log(`${endpoint} → ${r.status}, trying next…`);
          continue;
        }
        const token = parseToken(JSON.parse(text));
        if (token) { log(`✅ Token obtained`); return token; }
      } catch (e: any) {
        if (e.message === 'INVALID_API_KEY') throw e;
        log(`${endpoint} failed: ${e.message}`);
      }
    }
    throw new Error('ALL_TOKEN_ENDPOINTS_FAILED');
  };

  // ── Resolve avatar ID ─────────────────────────────────────────────────────
  const resolveStreamingAvatarId = async (): Promise<string> => {
    const apiKey = import.meta.env.VITE_HEYGEN_API_KEY;

    const currentAvatarId = avatarIdRef.current;
    if (currentAvatarId && currentAvatarId.trim()) {
      log('✅ Using stored avatar ID: ' + currentAvatarId);
      setResolvedAvatarId(currentAvatarId);
      return currentAvatarId.trim();
    }

    log('⚠️ No stored avatar ID — searching by name: ' + avatarName);
    let streamingAvatars: Array<{ id: string; name: string }> = [];
    try {
      const r = await fetch('/heygen-api/v1/streaming/avatar.list', {
        headers: { 'x-api-key': apiKey },
      });
      if (r.ok) {
        const data = await r.json();
        const raw: any[] =
          Array.isArray(data?.data) ? data.data :
          Array.isArray(data?.data?.avatars) ? data.data.avatars :
          Array.isArray(data?.avatars) ? data.avatars : [];
        streamingAvatars = raw.map((a: any) => ({
          id: a.avatar_id ?? a.id ?? '',
          name: (a.avatar_name ?? a.name ?? '').toLowerCase(),
        })).filter(a => a.id);
        log(`📋 ${streamingAvatars.length} streaming avatars available`);
        streamingAvatars.forEach(a => log('   • ' + a.id));
      }
    } catch (e: any) { log('⚠️ Could not fetch avatar list: ' + e.message); }

    if (avatarName && streamingAvatars.length > 0) {
      const firstWord = avatarName.trim().split(/\s+/)[0].toLowerCase();
      const match = streamingAvatars.find(a =>
        a.id.toLowerCase().startsWith(firstWord + '_') || a.id.toLowerCase() === firstWord
      );
      if (match) {
        log('✅ First-word match: "' + firstWord + '" → ' + match.id);
        setResolvedAvatarId(match.id);
        return match.id;
      }
      log('ℹ️ No match for first word "' + firstWord + '"');
    }

    const searchStr = (avatarName + ' ' + currentAvatarId).toLowerCase();
    for (const [keyword, ids] of Object.entries(KNOWN_STREAMING_AVATARS)) {
      if (searchStr.includes(keyword)) {
        for (const id of ids) {
          if (streamingAvatars.length === 0 || streamingAvatars.some(a => a.id === id)) {
            log(`✅ Known lookup: "${keyword}" → ${id}`);
            setResolvedAvatarId(id);
            return id;
          }
        }
      }
    }

    log('⚠️ Hard fallback: ' + DEFAULT_STREAMING_AVATAR);
    setResolvedAvatarId(DEFAULT_STREAMING_AVATAR);
    return DEFAULT_STREAMING_AVATAR;
  };

  // ── End avatar session ────────────────────────────────────────────────────
  const endSession = useCallback(async () => {
    if (!avatarRef.current) return;
    try { await avatarRef.current.stopAvatar(); } catch (_) {}
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.srcObject = null; }
    audioTracksRef.current = [];
    if (videoRef.current) videoRef.current.srcObject = null;
    avatarRef.current = null;
    hasSpokenInit.current = false;
    setHasVideo(false); setIsAvatarActive(false); setIsPlaying(false);
    log('Session ended');
  }, [log]);

  // ── Start avatar session ──────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    if (isLoadingSession || isAvatarActive) return;
    setIsLoadingSession(true);
    audioTracksRef.current = [];
    hasSpokenInit.current = false;

    try {
      const sessionToken = await fetchSessionToken();
      const resolvedId = await resolveStreamingAvatarId();
      setResolvedAvatarId(resolvedId);

      log(`Initialising SDK with avatar: ${resolvedId}`);
      avatarRef.current = new StreamingAvatar({ token: sessionToken });

      avatarRef.current.on(StreamingEvents.STREAM_READY, (event: any) => {
        const stream: MediaStream = event.detail;
        log(`STREAM_READY — ${stream.getTracks().map((t: MediaStreamTrack) => t.kind).join(', ')}`);

        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length && videoRef.current) {
          videoRef.current.srcObject = new MediaStream(videoTracks);
          videoRef.current.play().catch((e: Error) => log(`video.play() error: ${e.message}`));
          setHasVideo(true);
          log('✅ Video live');
        }

        stream.getAudioTracks().forEach((track: MediaStreamTrack) => {
          audioTracksRef.current.push(track);
          track.addEventListener('ended', () => {
            audioTracksRef.current = audioTracksRef.current.filter(t => t.id !== track.id);
            rebuildAudio();
          });
        });
        if (stream.getAudioTracks().length) rebuildAudio();
      });

      avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        setIsPlaying(true); log('Speaking…');
      });
      avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        setIsPlaying(false); log('Ready');
      });
      avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        setHasVideo(false); setIsAvatarActive(false); log('Disconnected');
      });

      log(`Starting avatar session…`);
      const sessionData = await avatarRef.current.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: resolvedId,
        language: 'en',
      });
      log(`✅ Session: ${sessionData?.session_id} | Avatar: ${resolvedId}`);
      setIsAvatarActive(true);

      setTimeout(() => {
        if (avatarRef.current) {
          const greeting = `Hello! . How can I help you ?`;
          avatarRef.current.speak({ text: greeting, taskType: TaskType.REPEAT, taskMode: TaskMode.SYNC })
            .catch((_: Error) => {});
        }
      }, 1000);

    } catch (err: any) {
      log(`❌ Error: ${err.message}`);
      const msgs: Record<string, string> = {
        NO_API_KEY: '❌ VITE_HEYGEN_API_KEY missing in .env',
        INVALID_API_KEY: '❌ HeyGen API key invalid (401)',
        ALL_TOKEN_ENDPOINTS_FAILED: '❌ Could not reach HeyGen. Check Vite proxy config.',
      };
      alert(msgs[err.message] ?? `❌ ${err.message}`);
    } finally {
      setIsLoadingSession(false);
    }
  }, [isLoadingSession, isAvatarActive, avatarName, rebuildAudio, log]); // eslint-disable-line

  // ── Speak a message via the avatar ────────────────────────────────────────
  const speakMessage = useCallback(async (text: string) => {
    if (!avatarRef.current || !isAvatarActive || !text.trim()) return;
    const clean = text
      .replace(/[#*`_~\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 900);
    try {
      await avatarRef.current.speak({ text: clean, taskType: TaskType.REPEAT, taskMode: TaskMode.SYNC });
    } catch (e: any) {
      log(`Speak error: ${e.message}`);
    }
  }, [isAvatarActive, log]);

  // ── Interrupt avatar speech ───────────────────────────────────────────────
  const handleInterrupt = useCallback(async () => {
    if (!avatarRef.current || !isPlaying) return;
    try { await avatarRef.current.interrupt(); } catch (_) {}
    setIsPlaying(false);
  }, [isPlaying]);

  // ── Chroma-key canvas rendering ───────────────────────────────────────────
  useEffect(() => {
    if (!hasVideo) {
      if (chromaRafRef.current) cancelAnimationFrame(chromaRafRef.current);
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const processFrame = () => {
      if (video.readyState < 2) { chromaRafRef.current = requestAnimationFrame(processFrame); return; }
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }
      ctx.drawImage(video, 0, 0, vw, vh);
      const frame = ctx.getImageData(0, 0, vw, vh);
      const d = frame.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (g > 80 && g > r * 1.3 && g > b * 1.3) d[i + 3] = 0;
      }
      ctx.putImageData(frame, 0, 0);
      chromaRafRef.current = requestAnimationFrame(processFrame);
    };

    chromaRafRef.current = requestAnimationFrame(processFrame);
    return () => { if (chromaRafRef.current) cancelAnimationFrame(chromaRafRef.current); };
  }, [hasVideo]);

  // ── Session timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAvatarActive) {
      timerRef.current = setInterval(() => setSessionDuration(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSessionDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isAvatarActive]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      endSession();
      if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.srcObject = null; }
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []); // eslint-disable-line

  // ── Speech recognition setup ──────────────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recognitionRef.current = new SR();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript.trim();
      setIsListening(false);
      if (transcript) {
        setInputValue(transcript);
        setAutoSendVoice(true);
      }
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    if (isPlaying) handleInterrupt();
    setIsListening(true);
    recognitionRef.current.start();
  };

  // ── File handling ─────────────────────────────────────────────────────────
  const handleAttachClick = () => fileInputRef.current?.click();
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) setAttachedFiles(prev => [...prev, ...files]);
    if (e.target) e.target.value = '';
  };
  const handleRemoveFile = (index: number) =>
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));

  const handleDownloadFromMetadata = useCallback((content: string, filename: string, mimeType: string = 'application/octet-stream') => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download file. Please try again.');
    }
  }, []);

  const handleDownloadFile = async (message: Message): Promise<void> => {
    if (!message.file_path) return;
    setDownloadingFileId(message.id);
    try {
      const token = auth.getToken();
      if (!token) throw new Error('No authentication token found');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}${message.file_path}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.filename || 'download.txt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(`Failed to download file: ${error.message}`);
    } finally {
      setDownloadingFileId(null);
    }
  };

  // ── Approval ──────────────────────────────────────────────────────────────
  const handleApprovalButtonClick = async (action: string) => {
    if (!pendingApproval) return;
    setApprovalClickedAction(action as 'approve' | 'reject');
    setApprovalProcessing(true);
    try {
      const endpoint = action === 'approve'
        ? '/api/v1/approvals/button-approve'
        : '/api/v1/approvals/button-reject';
      const response = await api.fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify({ approval_id: pendingApproval.approval_id }),
      });
      if (!response.ok) throw new Error(`Approval request failed: ${response.statusText}`);
      await response.json();

      const isSSL = pendingApproval.action_type === 'update_ssl_certificate';
      const approveText = isSSL
        ? '✓ SSL certificate update approved. Proceeding with activation...'
        : '✓ License approval confirmed. Proceeding with installation...';
      const rejectText = isSSL
        ? '✗ SSL certificate update rejected. Process aborted.'
        : '✗ License approval rejected. Process aborted.';
      const successText = isSSL
        ? '✓ SSL certificate imported and activated successfully!'
        : '✓ License installation completed!';
      const failText = isSSL ? '✗ SSL certificate update failed' : '✗ License installation failed';

      const actionMessage: Message = {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: action === 'approve' ? approveText : rejectText,
        sender: 'ai',
        timestamp: new Date(),
      }]);

      if (action === 'approve') {
        try {
          const executeResponse = await api.fetchWithAuth(`/api/v1/approvals/${pendingApproval.approval_id}`, {
            method: 'POST',
            body: JSON.stringify({ session_id: pendingApproval.session_id }),
          });
          if (executeResponse.ok) {
            const executeData = await executeResponse.json();
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              text: executeData.message || successText,
              sender: 'ai',
              timestamp: new Date(),
              isSuccess: executeData.success,
            }]);
          } else {
            const errorData = await executeResponse.json();
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              text: errorData.message || failText,
              sender: 'ai',
              timestamp: new Date(),
              isError: true,
            }]);
          }
        } catch (executeError: any) {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: `Error during update: ${executeError.message}`,
            sender: 'ai',
            timestamp: new Date(),
            isError: true,
          }]);
        }
      }
      setPendingApproval(null);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: `Error processing approval: ${error.message}`,
        sender: 'ai',
        isError: true,
        timestamp: new Date(),
      }]);
    } finally { 
      setApprovalProcessing(false);
      setApprovalClickedAction(null);
    }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;

    setPendingApproval(null);
    setShowWelcomeMessage(false);
    const userMessageIndex = Object.keys(chatHistory).filter(k => k.startsWith('User')).length + 1;
    const userKey = `User${userMessageIndex}`;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      files: attachedFiles.length > 0 ? attachedFiles.map(f => f.name) : undefined,
    };
    setMessages(prev => [...prev, userMessage]);

    const updatedHistory: ChatHistory = { ...chatHistory, [userKey]: inputValue };
    setChatHistory(updatedHistory);

    const currentInput = inputValue;
    const filesToSend = [...attachedFiles];
    setInputValue('');
    setAttachedFiles([]);
    setIsTyping(true);

    if (isPlaying) handleInterrupt();

    try {
      const filesData: FileData[] = [];
      for (const file of filesToSend) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        filesData.push({ name: file.name, type: file.type, data: base64 });
      }

      const currentSessionId = sessionIdRef.current || Date.now().toString();
      const response = await api.fetchWithAuth('/api/v1/chat', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 'current-user',
          session_id: currentSessionId,
          user_session_id: auth.getSessionId(),
          agent_id: agent?.id,
          agent_type: agent?.type || 'license',
          message: currentInput,
          files: filesData.length > 0 ? filesData : null,
          access_token: auth.getToken() || '',
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      const data = await response.json();
      const aiResponseText = data.message || 'I could not generate a response. Please try again.';

      if (data.session_id && !sessionIdRef.current) sessionIdRef.current = data.session_id;

      if (data.approval_metadata?.approval_id && data.approval_metadata?.approval_method === 'button') {
        setPendingApproval({
          approval_id: data.approval_metadata.approval_id,
          filename: data.approval_metadata.filename || 'file',
          expires_at: data.approval_metadata.expires_at,
          session_id: data.session_id,
          action_type: data.approval_metadata.action_type,
        });
      }

      setIsTyping(false);

      const agentMessageIndex = Object.keys(updatedHistory).filter(k => k.startsWith('Agent')).length + 1;
      const agentKey = `Agent${agentMessageIndex}`;
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
        file_path: data.file_path,
        filename: data.filename,
        metadata: data.metadata
      };
      setMessages(prev => [...prev, aiMessage]);
      setChatHistory({ ...updatedHistory, [agentKey]: aiResponseText });
      latestAIResponseRef.current = aiResponseText;
      await speakMessage(aiResponseText);

    } catch (error: any) {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 2, text: `Error: ${error.message}`, sender: 'ai', timestamp: new Date(), isError: true }]);
      await speakMessage("I'm sorry, I encountered an error. Please try again.");
    }
  }, [inputValue, chatHistory, agent, attachedFiles, isPlaying, speakMessage, handleInterrupt]);

  useEffect(() => {
    if (autoSendVoice && inputValue.trim()) {
      handleSend();
      setAutoSendVoice(false);
    }
  }, [autoSendVoice, inputValue, handleSend]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleClearChat = useCallback(async () => {
    if (isPlaying) { try { await avatarRef.current?.interrupt(); } catch (_) {} }
    setMessages([]); setInputValue(''); setChatHistory({}); sessionIdRef.current = null;
    setShowWelcomeMessage(true);
  }, [isPlaying]);

  const handleBack = useCallback(() => { endSession(); navigate('/agents'); }, [navigate, endSession]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /*
         * ══════════════════════════════════════════════════════════════════════
         * ROOT LAYOUT FIX
         *
         * The problem: this component renders INSIDE your app shell which has
         * a top navbar (~60px) and a sidebar. Using height:100vh makes .agc-root
         * taller than the visible area, so the page scrolls and the input box
         * disappears below the fold.
         *
         * The fix: use height:100% instead of height:100vh and make sure every
         * ancestor up to <body> is also height:100% / display:flex.
         *
         * We also add a targeted override on the route wrapper your framework
         * renders (commonly a <main>, <div class="content">, etc.) — adjust the
         * selector ".agc-page-host" to whatever your layout's content wrapper is.
         *
         * If you cannot change parent CSS, use the "position:fixed" variant
         * commented out below instead.
         * ══════════════════════════════════════════════════════════════════════
         */

        /*
         * Option A (preferred): make the component fill its flex parent.
         * Works when the route content area is already a flex column that
         * fills the remaining viewport height.
         */
        .agc-root {
          display: flex;
          flex-direction: column;
          /* Use 100% so we fill the parent container, NOT 100vh which
             ignores the top navbar and causes scroll */
          height: 100%;
          width: 100%;
          background: #F9FAFB;
          overflow: hidden;
          /* Fallback: if the parent isn't full-height, min-height pushes it */
          min-height: 0;
        }

        /*
         * Option B (nuclear fallback): if Option A still scrolls, uncomment
         * the block below and comment out Option A above. This fixes layout
         * by taking the component out of normal flow entirely.
         *
         * You will need to measure your app's top navbar height and set it as
         * the "top" value (default 60px — change to match your navbar).
         */
        /*
        .agc-root {
          position: fixed;
          top: 60px;
          left: 240px;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          background: #F9FAFB;
          overflow: hidden;
          z-index: 10;
        }
        */

        /* ── Header ── */
        .agc-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 20px;
          background: #fff;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          flex-shrink: 0;
          z-index: 20;
          height: 50px;
          box-sizing: border-box;
        }
        .agc-header-left { display: flex; align-items: center; gap: 16px; }
        .agc-back-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          color: #6366f1; font-size: 13px; font-weight: 600;
          padding: 6px 10px; border-radius: 8px;
          transition: all 0.15s;
        }
        .agc-back-btn:hover { background: #eef2ff; }

        .agc-identity { display: flex; align-items: center; gap: 10px; }
        .agc-avatar-ring-wrap { position: relative; width: 38px; height: 38px; }
        .agc-avatar-ring {
          position: absolute; inset: -2px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #10b981, #6366f1);
          background-size: 300% 300%;
          animation: agc-ring 4s linear infinite;
        }
        @keyframes agc-ring {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .agc-online-dot {
          position: absolute; bottom: 0; right: 0;
          width: 10px; height: 10px;
          background: #10b981; border-radius: 50%;
          border: 2px solid #fff; z-index: 2;
          animation: agc-pulse 2s ease infinite;
        }
        @keyframes agc-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(16,185,129,0); }
        }
        .agc-agent-name { font-size: 18px; font-weight: 700; color: #111827; }
        .agc-agent-status {
          font-size: 13px; color: #10b981; font-weight: 500;
          display: flex; align-items: center; gap: 4px;
        }
        .agc-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }
        .agc-header-actions { display: flex; align-items: center; gap: 8px; }
        .agc-hbtn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 9px;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.15s; border: 1px solid transparent;
        }
        .agc-hbtn-neutral { background: #fff; border-color: #e5e7eb; color: #6b7280; }
        .agc-hbtn-neutral:hover { background: #f9fafb; color: #374151; }
        .agc-hbtn-red { background: #fff5f5; border-color: #fecaca; color: #ef4444; }
        .agc-hbtn-red:hover { background: #fee2e2; }

        /*
         * BODY — the critical flex row that contains avatar + chat.
         * flex:1 + min-height:0 is the key combo that allows children
         * to independently scroll within the remaining height.
         */
        .agc-body {
          display: flex;
          flex: 1;
          min-height: 0;   /* ← CRITICAL: without this, flex children ignore overflow */
          overflow: hidden;
        }

        /* ── Avatar Panel — locked 350px ── */
        .agc-avatar-panel {
          width: 350px; min-width: 350px; max-width: 350px;
          flex-shrink: 0; flex-grow: 0;
          border-right: 1px solid #eaecf0;
          background: #fff;
          display: flex; flex-direction: column;
          overflow: hidden; position: relative;
        }

        .agc-avatar-stage {
          flex: 1; min-height: 0;
          position: relative; overflow: hidden;
          background: #f1f5f9;
        }

        .agc-speaking-ring {
          position: absolute; inset: 0; pointer-events: none; z-index: 5;
          border: 3px solid transparent; transition: border-color 0.3s;
        }
        .agc-speaking-ring.active {
          border-color: #10b981;
          animation: agc-speak-glow 1.2s ease-in-out infinite;
        }
        @keyframes agc-speak-glow {
          0%, 100% { box-shadow: inset 0 0 0 3px rgba(16,185,129,0.3); }
          50% { box-shadow: inset 0 0 0 3px rgba(16,185,129,0.7); }
        }

        /* Top bar — fixed 44px height */
        .agc-avatar-top-bar {
          position: absolute; top: 0; left: 0; right: 0; z-index: 10;
          padding: 0 8px;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          display: flex; align-items: center; justify-content: space-between; gap: 4px;
          height: 44px; box-sizing: border-box;
          overflow: hidden;
        }
        .agc-avatar-top-bar-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .agc-overlay-btn {
          display: flex; align-items: center; gap: 4px;
          height: 26px; box-sizing: border-box;
          padding: 0 8px; border-radius: 7px;
          font-size: 11px; font-weight: 600; cursor: pointer;
          border: 1px solid transparent;
          white-space: nowrap; flex-shrink: 0;
          transition: background 0.15s;
        }
        .agc-overlay-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .agc-overlay-btn-green  { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; }
        .agc-overlay-btn-green:hover:not(:disabled) { background: #d1fae5; }
        .agc-overlay-btn-red    { background: #fff5f5; border-color: #fca5a5; color: #b91c1c; }
        .agc-overlay-btn-red:hover:not(:disabled) { background: #fee2e2; }
        .agc-overlay-btn-amber  { background: #fffbeb; border-color: #fbbf24; color: #92400e; }
        .agc-overlay-btn-amber:hover:not(:disabled) { background: #fef3c7; }
        .agc-overlay-btn-white  { background: #f3f4f6; border-color: #e5e7eb; color: #374151; }
        .agc-overlay-btn-white:hover:not(:disabled) { background: #e5e7eb; }

        /* Status pill — fixed 82px so label change never shifts bar */
        .agc-status-pill-fixed {
          display: flex; align-items: center; gap: 5px;
          background: #f3f4f6; border: 1px solid #e5e7eb;
          padding: 4px 8px; border-radius: 20px;
          font-size: 11px; font-weight: 600; color: #374151;
          width: 82px; min-width: 82px; max-width: 82px;
          overflow: hidden; white-space: nowrap;
          box-sizing: border-box; flex-shrink: 0;
        }

        /* Idle state */
        .agc-avatar-idle {
          position: absolute; inset: 0; z-index: 2;
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-start;
          padding-top: 52px; /* clear the top bar */
        }
        /*
         * FIX: idle image fills the full remaining stage height, anchored
         * from the top so the head is never cropped.
         */
        .agc-avatar-idle-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: top center;
          display: block;
        }
        .agc-avatar-idle-placeholder {
          width: 220px; height: 280px; margin-top: 20px;
          border-radius: 20px;
          background: linear-gradient(135deg, #eef2ff, #e0e7ff);
          border: 2px solid #c7d2fe;
          display: flex; align-items: center; justify-content: center;
          font-size: 72px; font-weight: 700; color: #6366f1;
        }

        /* Bottom info bar */
        .agc-avatar-info-bar {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 10;
          padding: 10px 12px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(0,0,0,0.06);
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .agc-timer {
          font-size: 11px; color: #9ca3af;
          background: #f3f4f6; padding: 3px 10px; border-radius: 20px;
          font-variant-numeric: tabular-nums;
        }

        /*
         * CHAT PANEL — flex:1 so it takes all remaining horizontal space.
         * The critical inner layout: header (fixed) + messages (flex:1 scroll) +
         * input (fixed). This trio is what keeps the input always visible.
         */
        .agc-chat-panel {
          flex: 1;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #F9FAFB;
        }
        .agc-chat-header {
          height: 56px; flex-shrink: 0;
          padding: 0 16px; box-sizing: border-box;
          border-bottom: 1px solid #eaecf0;
          background: #fff;
          display: flex; align-items: center; justify-content: space-between;
        }

        /*
         * MESSAGES — the scroll container.
         * flex:1 expands to fill all available height.
         * min-height:0 is required — without it a flex child won't honour
         * overflow:auto and the content pushes the input off screen.
         * overflow-y:auto gives the inner scroll.
         */
        .agc-messages {
          flex: 1;
          min-height: 0;        /* ← THE critical rule */
          overflow-y: auto;
          padding: 16px;
          display: flex; flex-direction: column; gap: 4px;
          scrollbar-width: thin; scrollbar-color: #e5e7eb transparent;
        }
        .agc-messages::-webkit-scrollbar { width: 4px; }
        .agc-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }

        /* Welcome */
        .agc-welcome {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 60px 20px; text-align: center;
          animation: agc-fadeup 0.5s ease;
        }
        @keyframes agc-fadeup { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .agc-welcome-orb {
          width: 72px; height: 72px; border-radius: 50%;
          overflow: hidden; border: 3px solid #c7d2fe;
          margin: 0 auto 16px;
          animation: agc-float 4s ease-in-out infinite;
        }
        .agc-welcome-orb-icon {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #eef2ff, #ede9fe);
          border: 1.5px solid #c7d2fe;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          animation: agc-float 4s ease-in-out infinite;
        }
        @keyframes agc-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .agc-welcome-title { font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 8px; }
        .agc-welcome-sub { font-size: 15px; color: #9ca3af; }

        /* Messages */
        .agc-row { display: flex; align-items: flex-end; gap: 8px; animation: agc-msgin 0.22s ease; }
        .agc-row.user { justify-content: flex-end; }
        .agc-row.ai, .agc-row.system { justify-content: flex-start; }
        @keyframes agc-msgin { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .agc-msg-avatar { width: 28px; height: 28px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 1.5px solid #e5e7eb; }
        .agc-bubble { max-width: 68%; padding: 10px 14px; border-radius: 18px; font-size: 14px; word-break: break-word; line-height: 1.65; }
        .agc-bubble.user { background: linear-gradient(135deg,#4f46e5,#6366f1); color:#fff; border-bottom-right-radius:5px; box-shadow:0 4px 14px rgba(99,102,241,0.28); }
        .agc-bubble.ai { background:#fff; color:#1f2937; border:1px solid #e5e7eb; border-bottom-left-radius:5px; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
        .agc-bubble.system { background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; border-radius:12px; font-size:12.5px; }
        .agc-bubble.error { background:#fff5f5; color:#b91c1c; border-color:#fecaca; }
        .agc-ts { font-size:10px; color:#d1d5db; margin-top:2px; display:flex; }
        .agc-ts.user { justify-content:flex-end; }
        .agc-ts.ai, .agc-ts.system { justify-content:flex-start; padding-left:36px; }

        /* Typing */
        .agc-typing { background:#fff; border:1px solid #e5e7eb; border-radius:18px; border-bottom-left-radius:5px; padding:12px 16px; display:flex; gap:5px; align-items:center; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
        .agc-dot { width:7px; height:7px; border-radius:50%; background:#c7d2fe; animation:agc-bounce 1.2s ease-in-out infinite; }
        .agc-dot:nth-child(2) { animation-delay:.18s; background:#a5b4fc; }
        .agc-dot:nth-child(3) { animation-delay:.36s; background:#818cf8; }
        @keyframes agc-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

        /* Approval */
        .agc-approval {
          background: #fff; border: 1.5px solid #d1fae5;
          border-radius: 14px; padding: 14px 16px;
          max-width: 68%; box-shadow: 0 2px 10px rgba(16,185,129,0.08);
        }
        .agc-approval-title { font-size: 12.5px; font-weight: 600; color: #374151; margin-bottom: 10px; }
        .agc-approval-actions { display: flex; gap: 8px; }
        .agc-approve {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 14px; border-radius: 8px;
          background: #ecfdf5; border: 1px solid #6ee7b7;
          color: #065f46; font-size: 12px; font-weight: 500; cursor: pointer;
          transition: background 0.15s;
        }
        .agc-approve:hover { background: #d1fae5; }
        .agc-approve:disabled { opacity: 0.5; cursor: not-allowed; }
        .agc-approve.agc-btn-active { box-shadow: 0 0 0 2px #6ee7b7; opacity: 1 !important; }
        .agc-reject {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 14px; border-radius: 8px;
          background: #fff5f5; border: 1px solid #fca5a5;
          color: #b91c1c; font-size: 12px; font-weight: 500; cursor: pointer;
          transition: background 0.15s;
        }
        .agc-reject:hover { background: #fee2e2; }
        .agc-reject:disabled { opacity: 0.5; cursor: not-allowed; }
        .agc-reject.agc-btn-active { box-shadow: 0 0 0 2px #fca5a5; opacity: 1 !important; }
        .agc-approval-processing {
          display: flex; align-items: center; gap: 7px;
          margin-top: 10px; font-size: 11.5px; color: #6b7280;
        }
        .agc-approval-processing .agc-spinner {
          width: 13px; height: 13px;
          border: 2px solid #d1d5db; border-top-color: #6366f1;
          border-radius: 50%; animation: agc-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes agc-spin { to { transform: rotate(360deg); } }
        .agc-approval { background:#fff; border:1.5px solid #d1fae5; border-radius:14px; padding:14px 16px; max-width:68%; }
        .agc-approval-title { font-size:12.5px; font-weight:600; color:#374151; margin-bottom:10px; }
        .agc-approval-actions { display:flex; gap:8px; }
        .agc-approve { display:flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px; background:#ecfdf5; border:1px solid #6ee7b7; color:#065f46; font-size:12px; font-weight:500; cursor:pointer; }
        .agc-approve:hover { background:#d1fae5; }
        .agc-approve:disabled { opacity:.5; cursor:not-allowed; }
        .agc-reject { display:flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px; background:#fff5f5; border:1px solid #fca5a5; color:#b91c1c; font-size:12px; font-weight:500; cursor:pointer; }
        .agc-reject:hover { background:#fee2e2; }
        .agc-reject:disabled { opacity:.5; cursor:not-allowed; }

        /*
         * INPUT ZONE — flex-shrink:0 is essential.
         * It must NEVER shrink, or the messages will push it off screen
         * when the content grows taller than the available height.
         */
        .agc-input-zone {
          flex-shrink: 0;
          background: #fff; border-top: 1px solid #eaecf0;
          padding: 10px 16px 12px;
        }
        .agc-file-chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
        .agc-chip { display:flex; align-items:center; gap:5px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:3px 8px; font-size:11.5px; color:#4f46e5; }
        .agc-chip-x { background:none; border:none; color:#a5b4fc; cursor:pointer; font-size:13px; padding:0; }
        .agc-chip-x:hover { color:#ef4444; }
        .agc-input-wrap { display:flex; align-items:center; gap:8px; background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:14px; padding:7px 10px; transition:border-color .2s,box-shadow .2s; }
        .agc-input-wrap:focus-within { border-color:#a5b4fc; box-shadow:0 0 0 3px rgba(99,102,241,0.08); background:#fff; }
        .agc-icon-btn { background:none; border:none; color:#d1d5db; cursor:pointer; padding:5px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0; transition:color .15s,background .15s; }
        .agc-icon-btn:hover { color:#9ca3af; background:#f3f4f6; }
        .agc-icon-btn.recording { color:#ef4444; animation:agc-pulse-red 1s ease-in-out infinite; }
        @keyframes agc-pulse-red { 0%,100%{opacity:1} 50%{opacity:.5} }
        .agc-text-input { flex:1; background:none; border:none; outline:none; color:#111827; font-size:13.5px; padding:4px 0; }
        .agc-text-input::placeholder { color:#d1d5db; }
        .agc-divider { width:1px; height:18px; background:#e5e7eb; flex-shrink:0; }
        .agc-send-btn { display:flex; align-items:center; gap:6px; padding:8px 18px; border-radius:10px; background:linear-gradient(135deg,#4f46e5,#6366f1); border:none; color:#fff; font-size:13px; font-weight:600; cursor:pointer; flex-shrink:0; box-shadow:0 4px 12px rgba(99,102,241,.3); transition:all .18s; }
        .agc-send-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,.38); }
        .agc-send-btn:disabled { opacity:.35; cursor:not-allowed; transform:none; box-shadow:none; }
        .agc-spinner { width:11px; height:11px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%; animation:agc-spin .65s linear infinite; }
        @keyframes agc-spin { to{transform:rotate(360deg)} }
      `}</style>

      <div className="agc-root">

        {/* ── TOP HEADER ── */}
        <header className="agc-header">
          <div className="agc-header-left">
            <button className="agc-back-btn" onClick={handleBack}>
              <FaArrowLeft size={11} /> Back to Agents
            </button>
          </div>
          <div className="agc-header-actions">
            {isAvatarActive && <span className="agc-timer">⏱ {fmt(sessionDuration)}</span>}
            {isAvatarActive && (
              <button className="agc-hbtn agc-hbtn-neutral" onClick={handleInterrupt} disabled={!isPlaying}>
                ⏸ Interrupt
              </button>
            )}
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="agc-body">

          {/* ══ LEFT: AVATAR PANEL ══ */}
          <div className="agc-avatar-panel">
            <div className="agc-avatar-stage">

              <div className={`agc-speaking-ring ${isPlaying ? 'active' : ''}`} />

              <video ref={videoRef} autoPlay playsInline muted
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }} />

              {hasVideo && (
                <canvas ref={canvasRef} style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  objectFit: 'contain', objectPosition: 'top center',
                  display: 'block', background: '#f8fafc',
                }} />
              )}

              {!hasVideo && (
                <div className="agc-avatar-idle">
                  {isLoadingSession ? (
                    <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'agc-spin 0.8s linear infinite' }} />
                      <span style={{ color: '#6366f1', fontSize: 13, fontWeight: 500 }}>Connecting…</span>
                    </div>
                  ) : avatarImg ? (
                    <img src={avatarImg} alt={avatarName} className="agc-avatar-idle-img" />
                  ) : (
                    <div className="agc-avatar-idle-placeholder">{(avatarName[0] ?? 'A').toUpperCase()}</div>
                  )}
                </div>
              )}

              {/* ── TOP BAR ── */}
              <div className="agc-avatar-top-bar">
                <span className="agc-status-pill-fixed">
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: isPlaying ? '#10b981' : isListening ? '#ef4444' : isTyping ? '#6366f1' : isAvatarActive ? '#10b981' : '#6b7280',
                  }} />
                  {isPlaying ? 'Speaking' : isListening ? 'Listening' : isTyping ? 'Thinking' : isAvatarActive ? 'Ready' : 'Inactive'}
                </span>

                <div className="agc-avatar-top-bar-actions">
                  {!isAvatarActive ? (
                    <button className="agc-overlay-btn agc-overlay-btn-green" onClick={startSession} disabled={isLoadingSession}>
                      {isLoadingSession
                        ? <><div className="agc-spinner" style={{ width: 8, height: 8, borderTopColor: '#6ee7b7' }} /> Starting…</>
                        : <>▶ Start</>}
                    </button>
                  ) : (
                    <>
                      {audioBlocked && <button className="agc-overlay-btn agc-overlay-btn-amber" onClick={handleUnmuteAudio}>🔇</button>}
                      <button className="agc-overlay-btn agc-overlay-btn-white" onClick={handleMuteToggle} title={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
                      <button className="agc-overlay-btn agc-overlay-btn-white" onClick={handleInterrupt} disabled={!isPlaying} title="Pause">⏸</button>
                      <button className="agc-overlay-btn agc-overlay-btn-green" onClick={startListening} disabled={isListening || isTyping}>
                        <FaMicrophone size={10} />{isListening ? 'Listening…' : 'Speak'}
                      </button>
                      <button className="agc-overlay-btn agc-overlay-btn-red" onClick={endSession}>⏹ End</button>
                    </>
                  )}
                </div>
              </div>

              {/* ── BOTTOM BAR ── */}
              <div className="agc-avatar-info-bar">
                {isAvatarActive && (
                  <span style={{ fontSize: 11, color: '#065f46', fontWeight: 600, background: '#ecfdf5', padding: '2px 8px', borderRadius: 10, border: '1px solid #6ee7b7' }}>
                    🟢 Live · {fmt(sessionDuration)}s
                  </span>
                )}
                {agent?.description && (
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>
                    {agent.description.substring(0, 40)}{agent.description.length > 40 ? '…' : ''}
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* ══ RIGHT: CHAT PANEL ══ */}
          <div className="agc-chat-panel">

            {/* Chat header */}
            <div className="agc-chat-header">
              <div className="agc-identity">
                <div className="agc-avatar-ring-wrap">
                  <div className="agc-avatar-ring" />
                  <AvatarImg src={avatarImg} name={avatarName} size={38}
                    className="relative z-10 border-2 border-white"
                    style={{ position: 'relative', zIndex: 1 } as React.CSSProperties} />
                  <div className="agc-online-dot" />
                </div>
                <div>
                  <div className="agc-agent-name">{agent?.name || avatarName}</div>
                  <div className="agc-agent-status">
                    <div className="agc-status-dot" /> Online · Ready to help
                  </div>
                </div>
              </div>
              <button className="agc-hbtn agc-hbtn-red" onClick={handleClearChat}>
                <IoClose style={{ fontSize: 13 }} /> Clear chat
              </button>
            </div>

            {/* Messages — independently scrollable */}
            <div className="agc-messages">
              {messages.length === 0 && showWelcomeMessage ? (
                <div className="agc-welcome">
                  {/* {avatarImg
                    ? <div className="agc-welcome-orb"><img src={avatarImg} alt={avatarName} className="w-full h-full object-cover object-top" /></div>
                    : <div className="agc-welcome-orb-icon"><span style={{ fontSize: 28 }}>✨</span></div>
                  } */}
                  <div className="agc-welcome-title">{loadingAgent ? 'Loading agent…' : 'How may I help you?'}</div>
                  <div className="agc-welcome-sub">{agent?.description || agent?.role || 'Your intelligent license agent'}</div>
                </div>
              ) : (
                <>
                  {messages.map(message => (
                    <div key={message.id}>
                      <div className={`agc-row ${message.sender}`}>
                        {(message.sender === 'ai' || message.sender === 'system') && (
                          <div className="agc-msg-avatar"><AvatarImg src={avatarImg} name={avatarName} size={28} /></div>
                        )}
                        <div className={`agc-bubble ${message.sender}${message.isError ? ' error' : ''}`}>
                          <div dangerouslySetInnerHTML={{ __html: message.text }} />
                          {message.files && message.files.length > 0 && (
                            <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>📎 {message.files.join(', ')}</div>
                          )}
                          {message.metadata?.type && message.metadata?.filename && (
                            <div style={{ marginTop: 8 }}>
                              <button onClick={() => handleDownloadFromMetadata(message.metadata?.csr_content || '', message.metadata?.filename || 'file.txt', 'application/x-pem-file')}
                                style={{ padding: '6px 12px', fontSize: 12, backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                📥 Download {message.metadata.filename}
                              </button>
                            </div>
                          )}
                          {message.file_path && message.sender === 'ai' && (
                            <div style={{ marginTop: 8 }}>
                              <button onClick={() => handleDownloadFile(message)} disabled={downloadingFileId === message.id}
                                style={{ padding: '6px 12px', fontSize: 12, backgroundColor: downloadingFileId === message.id ? '#9ca3af' : '#4f46e5', color: 'white', border: 'none', borderRadius: 6, cursor: downloadingFileId === message.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {downloadingFileId === message.id ? '⏳ Downloading...' : `📥 Download ${message.filename || 'file'}`}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`agc-ts ${message.sender}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="agc-row ai">
                      <div className="agc-msg-avatar"><AvatarImg src={avatarImg} name={avatarName} size={28} /></div>
                      <div className="agc-typing">
                        <div className="agc-dot" /><div className="agc-dot" /><div className="agc-dot" />
                      </div>
                    </div>
                  )}

                  {pendingApproval && (
                    <div className="agc-row ai">
                      <div className="agc-msg-avatar"><AvatarImg src={avatarImg} name={avatarName} size={28} /></div>
                      <div className="agc-approval">
                        <div className="agc-approval-title">
                          🔐{' '}
                          {pendingApproval.action_type === 'update_ssl_certificate'
                            ? <>Approve SSL certificate update for{' '}<strong style={{ color: '#4f46e5' }}>{pendingApproval.filename}</strong>?</>
                            : <>Approve license installation for{' '}<strong style={{ color: '#4f46e5' }}>{pendingApproval.filename}</strong>?</>
                          }
                        </div>
                        <div className="agc-approval-actions">
                          <button
                            className={`agc-approve${approvalClickedAction === 'approve' ? ' agc-btn-active' : ''}`}
                            onClick={() => handleApprovalButtonClick('approve')}
                            disabled={approvalProcessing}>
                            ✓ Approve
                          </button>
                          <button
                            className={`agc-reject${approvalClickedAction === 'reject' ? ' agc-btn-active' : ''}`}
                            onClick={() => handleApprovalButtonClick('reject')}
                            disabled={approvalProcessing}>
                            ✗ Reject
                          🔐 Approve license installation for <strong style={{ color: '#4f46e5' }}>{pendingApproval.filename}</strong>?
                        </div>
                        <div className="agc-approval-actions">
                          <button className="agc-approve" onClick={() => handleApprovalButtonClick('approve')} disabled={approvalProcessing}>
                            {approvalProcessing ? <div className="agc-spinner" style={{ borderTopColor: '#065f46', width: 10, height: 10 }} /> : '✓'} Approve
                          </button>
                          <button className="agc-reject" onClick={() => handleApprovalButtonClick('reject')} disabled={approvalProcessing}>
                            {approvalProcessing ? <div className="agc-spinner" style={{ borderTopColor: '#b91c1c', width: 10, height: 10 }} /> : '✗'} Reject
                          </button>
                        </div>
                        {approvalProcessing && (
                          <div className="agc-approval-processing">
                            <div className="agc-spinner" />
                            {approvalClickedAction === 'approve' ? 'Approving…' : 'Rejecting…'}
                          </div>
                        )}
                        {pendingApproval.expires_at && (
                          <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 8 }}>Expires {new Date(pendingApproval.expires_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input zone — always pinned at bottom */}
            <div className="agc-input-zone">
              {attachedFiles.length > 0 && (
                <div className="agc-file-chips">
                  {attachedFiles.map((file, i) => (
                    <div key={i} className="agc-chip">
                      <span>📎</span>
                      <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <button className="agc-chip-x" onClick={() => handleRemoveFile(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <input ref={fileInputRef} type="file" onChange={handleFileSelect} multiple accept=".lic,.txt,.pem,.crt,.key,.license" style={{ display: 'none' }} />

              <div className="agc-input-wrap">
                <button className="agc-icon-btn" onClick={handleAttachClick} title="Attach file"><IoAttachOutline /></button>
                <input type="text" className="agc-text-input" value={inputValue}
                  onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyPress}
                  placeholder={isAvatarActive ? `Ask ${avatarName} anything…` : 'Type your message…'}
                  disabled={isTyping} />
                <button className={`agc-icon-btn ${isListening ? 'recording' : ''}`} onClick={startListening}
                  disabled={isListening || isTyping} title={isListening ? 'Listening…' : 'Voice input'}>
                  <FaMicrophone />
                </button>
                <div className="agc-divider" />
                <button className="agc-send-btn" onClick={handleSend} disabled={isTyping || !inputValue.trim()}>
                  {isTyping ? <><div className="agc-spinner" /> Sending…</> : <><FaPaperPlane size={12} /> Send</>}
                </button>
              </div>
            </div>

          </div>{/* end chat panel */}
        </div>{/* end body */}
      </div>
    </>
  );
};

export default AgentChat; 