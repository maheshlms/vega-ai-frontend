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
  // Read from config (full API response) OR top-level (preloaded card object)
  const avatarImg  = agent?.config?.selectedAvatarImg  || (agent as any)?.avatarImg  || '';
  const avatarName = agent?.config?.selectedAvatarName || (agent as any)?.avatarName || agent?.name || 'Agent';
  const avatarId   = agent?.config?.selectedAvatarId   || '';

  // ── FIX: avatarIdRef keeps avatarId fresh inside stale useCallback closures ──
  const avatarIdRef = useRef(avatarId);
  useEffect(() => { avatarIdRef.current = avatarId; }, [avatarId]);

  // ── Scroll ────────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  // ── FIX: Always fetch full agent from API to get config.selectedAvatarId ──
  // preloadedAgent from location.state is a card object with NO config — so
  // we always call the API regardless of whether preloadedAgent exists.
  useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId || agentId.startsWith('default-')) { setLoadingAgent(false); return; }
      try {
        const data = await api.llmRuntime.getAgent(agentId);
        setAgent(data); // full agent with config.selectedAvatarId populated
      } catch (err) {
        console.error('Failed to load agent details', err);
        setAgentError('Unable to load agent details');
        // Fall back to preloaded card data if API fails
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

  // ── Mute toggle ───────────────────────────────────────────────────────────
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

  // ── FIX: Resolve avatar ID — uses avatarIdRef (always fresh) as primary path ──
  // OLD BUG: avatarId from closure was always '' (stale), fell through to
  //          streamingAvatars[0] — so every agent got the same first avatar.
  // FIX:     Read avatarIdRef.current (never stale). If set, use it directly.
  //          Fallback matches ONLY first word of agent name (e.g. "Pedro" not "Thaddeus").
  const resolveStreamingAvatarId = async (): Promise<string> => {
    const apiKey = import.meta.env.VITE_HEYGEN_API_KEY;

    // ✅ PRIMARY: stored avatar ID from ref (avoids stale closure)
    const currentAvatarId = avatarIdRef.current;
    if (currentAvatarId && currentAvatarId.trim()) {
      log('✅ Using stored avatar ID: ' + currentAvatarId);
      setResolvedAvatarId(currentAvatarId);
      return currentAvatarId.trim();
    }

    // FALLBACK: no stored ID — fetch list and match by first name word only
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

    // Match FIRST WORD only — "Pedro Professional Look Agent" → "pedro"
    // Ensures Pedro→Pedro_* and never accidentally matches Thaddeus_*
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

    // KNOWN_STREAMING_AVATARS lookup
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
          const greeting = `Hello! I'm ${avatarName}. How can I help you today?`;
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

  // ── Interrupt avatar speech ────────────────────────────────────────────────
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
      // Use FULL video dimensions — no cropping, shows full body
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      canvas.width = vw;
      canvas.height = vh;
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
      const t = e.results[0][0].transcript;
      setInputValue(t);
      setIsListening(false);
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
  };
  const handleRemoveFile = (index: number) =>
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));

  // ── Approval ──────────────────────────────────────────────────────────────
  const handleApprovalButtonClick = async (action: string) => {
    if (!pendingApproval) return;
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

      const actionMessage: Message = {
        id: Date.now(),
        text: action === 'approve'
          ? '✓ License approval confirmed. Proceeding with installation...'
          : '✗ License approval rejected.',
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, actionMessage]);

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
              text: executeData.message || '✓ License installation completed!',
              sender: 'system',
              timestamp: new Date(),
              isSuccess: executeData.success,
            }]);
          } else {
            const errorData = await executeResponse.json();
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              text: errorData.message || '✗ License installation failed',
              sender: 'system',
              timestamp: new Date(),
              isError: true,
            }]);
          }
        } catch (executeError: any) {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: `Error during installation: ${executeError.message}`,
            sender: 'system',
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
        sender: 'system',
        isError: true,
        timestamp: new Date(),
      }]);
    } finally { setApprovalProcessing(false); }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;

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
          filename: data.approval_metadata.filename || 'license file',
          expires_at: data.approval_metadata.expires_at,
          session_id: data.session_id,
        });
      }

      setIsTyping(false);

      const agentMessageIndex = Object.keys(updatedHistory).filter(k => k.startsWith('Agent')).length + 1;
      const agentKey = `Agent${agentMessageIndex}`;
      const aiMessage: Message = { id: Date.now() + 1, text: aiResponseText, sender: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);

      const newHistory: ChatHistory = { ...updatedHistory, [agentKey]: aiResponseText };
      setChatHistory(newHistory);

      latestAIResponseRef.current = aiResponseText;
      await speakMessage(aiResponseText);

    } catch (error: any) {
      setIsTyping(false);
      const errText = `Error: ${error.message}`;
      setMessages(prev => [...prev, { id: Date.now() + 2, text: errText, sender: 'ai', timestamp: new Date(), isError: true }]);
      await speakMessage("I'm sorry, I encountered an error. Please try again.");
    }
  }, [inputValue, chatHistory, agent, attachedFiles, isPlaying, speakMessage, handleInterrupt]);

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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .agc-root {
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #F9FAFB;
          overflow: hidden;
        }

        /* ── Header ── */
        .agc-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 24px;
          background: #fff;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          flex-shrink: 0;
          z-index: 20;
        }
        .agc-header-left { display: flex; align-items: center; gap: 16px; }
        .agc-back-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          color: #6366f1; font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          padding: 6px 10px; border-radius: 8px;
          transition: all 0.15s;
        }
        .agc-back-btn:hover { background: #eef2ff; }

        .agc-identity { display: flex; align-items: center; gap: 10px; }
        .agc-avatar-ring-wrap {
          position: relative; width: 38px; height: 38px;
        }
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
        .agc-agent-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700; color: #111827;
        }
        .agc-agent-status {
          font-size: 11px; color: #10b981; font-weight: 500;
          display: flex; align-items: center; gap: 4px;
        }
        .agc-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }

        .agc-header-actions { display: flex; align-items: center; gap: 8px; }
        .agc-hbtn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 9px;
          font-size: 13px; font-weight: 500; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
          border: 1px solid transparent;
        }
        .agc-hbtn-neutral { background: #fff; border-color: #e5e7eb; color: #6b7280; }
        .agc-hbtn-neutral:hover { background: #f9fafb; color: #374151; }
        .agc-hbtn-red { background: #fff5f5; border-color: #fecaca; color: #ef4444; }
        .agc-hbtn-red:hover { background: #fee2e2; }

        /* ── Body: avatar left + chat right ── */
        .agc-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* ── LEFT: Avatar Panel — full-body rectangle ── */
        .agc-avatar-panel {
          width: 340px;
          min-width: 300px;
          flex-shrink: 0;
          border-right: 1px solid #eaecf0;
          background: #fff;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* Full-height avatar stage */
        .agc-avatar-stage {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: #f1f5f9;
        }

        /* Speaking border glow */
        .agc-speaking-ring {
          position: absolute; inset: 0; pointer-events: none; z-index: 5;
          border: 3px solid transparent;
          transition: border-color 0.3s;
        }
        .agc-speaking-ring.active {
          border-color: #10b981;
          animation: agc-speak-glow 1.2s ease-in-out infinite;
        }
        @keyframes agc-speak-glow {
          0%, 100% { box-shadow: inset 0 0 0 3px rgba(16,185,129,0.3); }
          50% { box-shadow: inset 0 0 0 3px rgba(16,185,129,0.7); }
        }

        /* The canvas / video fills the stage vertically, centred horizontally */
        .agc-avatar-canvas-full {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: top center;
          display: block;
        }

        /* Name + status bar pinned at bottom of stage — white theme */
        .agc-avatar-info-bar {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 10;
          padding: 14px 14px 12px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(0,0,0,0.06);
          display: flex; flex-direction: column; gap: 4px;
        }
        .agc-avatar-name-badge {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700; color: #111827;
        }
        .agc-avatar-status-row {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }

        /* Buttons bar at TOP of the stage — white theme */
        .agc-avatar-top-bar {
          position: absolute; top: 0; left: 0; right: 0; z-index: 10;
          padding: 10px 12px;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          display: flex; align-items: center; justify-content: space-between; gap: 6px;
        }
        .agc-overlay-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 8px;
          font-size: 11px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
          border: 1px solid transparent;
        }
        .agc-overlay-btn-green {
          background: #ecfdf5; border-color: #6ee7b7; color: #065f46;
        }
        .agc-overlay-btn-green:hover { background: #d1fae5; }
        .agc-overlay-btn-red {
          background: #fff5f5; border-color: #fca5a5; color: #b91c1c;
        }
        .agc-overlay-btn-red:hover { background: #fee2e2; }
        .agc-overlay-btn-amber {
          background: #fffbeb; border-color: #fbbf24; color: #92400e;
        }
        .agc-overlay-btn-amber:hover { background: #fef3c7; }
        .agc-overlay-btn-white {
          background: #f3f4f6; border-color: #e5e7eb; color: #374151;
        }
        .agc-overlay-btn-white:hover { background: #e5e7eb; }
        .agc-overlay-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Idle state (no video) — white theme, large portrait */
        .agc-avatar-idle {
          position: absolute; inset: 0; z-index: 2;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px; padding: 60px 20px 80px; text-align: center;
        }
        .agc-avatar-idle-img {
          width: 100%; max-width: 220px; height: 280px;
          border-radius: 20px; overflow: hidden;
          border: 2px solid #e5e7eb;
          box-shadow: 0 8px 32px rgba(99,102,241,0.12);
          object-fit: cover; object-position: top;
        }
        .agc-avatar-idle-placeholder {
          width: 220px; height: 280px;
          border-radius: 20px;
          background: linear-gradient(135deg, #eef2ff, #e0e7ff);
          border: 2px solid #c7d2fe;
          display: flex; align-items: center; justify-content: center;
          font-size: 72px; font-weight: 700; color: #6366f1;
          box-shadow: 0 8px 32px rgba(99,102,241,0.12);
        }

        .agc-avatar-status-row {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .agc-status-pill {
          display: flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 600;
        }
        .agc-status-pill.speaking { background: #ecfdf5; color: #065f46; }
        .agc-status-pill.listening { background: #fee2e2; color: #b91c1c; }
        .agc-status-pill.processing { background: #eff6ff; color: #1e40af; }
        .agc-status-pill.idle { background: #f3f4f6; color: #6b7280; }
        .agc-status-pill.inactive { background: #f9fafb; color: #9ca3af; }
        .agc-status-dot2 { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

        .agc-timer {
          font-size: 11px; color: #9ca3af; font-variant-numeric: tabular-nums;
          background: #f3f4f6; padding: 3px 10px; border-radius: 20px;
        }

        /* Avatar controls */
        .agc-controls {
          display: flex; flex-direction: column; gap: 10px; width: 100%;
        }
        .agc-ctrl-row {
          display: flex; gap: 8px; justify-content: center;
        }
        .agc-ctrl-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 10px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
          border: none;
        }
        .agc-ctrl-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .agc-ctrl-primary { background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
        .agc-ctrl-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(99,102,241,0.4); }
        .agc-ctrl-danger { background: #fff; border: 1.5px solid #fca5a5 !important; color: #ef4444; }
        .agc-ctrl-danger:hover:not(:disabled) { background: #fff5f5; }
        .agc-ctrl-neutral { background: #fff; border: 1.5px solid #e5e7eb !important; color: #6b7280; }
        .agc-ctrl-neutral:hover:not(:disabled) { background: #f9fafb; color: #374151; }
        .agc-ctrl-muted { background: #fff3cd; border: 1.5px solid #fbbf24 !important; color: #92400e; }

        .agc-start-btn {
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 14px;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
          transition: all 0.2s;
        }
        .agc-start-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
        .agc-start-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .agc-unmute-btn {
          width: 100%;
          padding: 8px;
          border-radius: 10px;
          background: #fef3c7;
          border: 1.5px solid #f59e0b;
          color: #92400e;
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          animation: agc-glow-amber 1.5s ease-in-out infinite;
        }
        @keyframes agc-glow-amber {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(245,158,11,0); }
        }

        /* Debug panel */
        .agc-debug summary {
          font-size: 11px; color: #6ee7b7; font-family: monospace;
          cursor: pointer; padding: 6px 10px;
          background: #111827; border-radius: 8px 8px 0 0;
          list-style: none;
        }
        .agc-debug summary::-webkit-details-marker { display: none; }
        .agc-debug[open] summary { border-radius: 8px 8px 0 0; }
        .agc-debug-body {
          background: #111827; border-radius: 0 0 8px 8px;
          max-height: 140px; overflow-y: auto;
          padding: 4px 10px 8px;
        }
        .agc-debug-line {
          font-size: 10px; font-family: monospace;
          padding: 2px 0; border-bottom: 1px solid #1f2937;
          color: #9ca3af;
        }
        .agc-debug-line.ok { color: #6ee7b7; }
        .agc-debug-line.err { color: #fca5a5; }
        .agc-debug-line.warn { color: #fde68a; }

        /* ── RIGHT: Chat Panel ── */
        .agc-chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #F9FAFB;
        }

        .agc-chat-header {
          padding: 14px 20px;
          border-bottom: 1px solid #eaecf0;
          background: #fff;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .agc-chat-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700; color: #111827;
        }
        .agc-chat-subtitle { font-size: 12px; color: #9ca3af; margin-top: 2px; }

        .agc-messages {
          flex: 1; overflow-y: auto; padding: 20px;
          display: flex; flex-direction: column; gap: 4px;
          scrollbar-width: thin; scrollbar-color: #e5e7eb transparent;
        }
        .agc-messages::-webkit-scrollbar { width: 4px; }
        .agc-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }

        /* Welcome screen */
        .agc-welcome {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 60px 20px; text-align: center;
          animation: agc-fadeup 0.5s ease;
        }
        @keyframes agc-fadeup {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .agc-welcome-orb {
          width: 72px; height: 72px; border-radius: 50%;
          overflow: hidden; border: 3px solid #c7d2fe;
          margin: 0 auto 16px;
          box-shadow: 0 8px 28px rgba(99,102,241,0.2);
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
        @keyframes agc-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .agc-welcome-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 8px;
        }
        .agc-welcome-sub { font-size: 13px; color: #9ca3af; }

        /* Message rows */
        .agc-row { display: flex; align-items: flex-end; gap: 8px; animation: agc-msgin 0.22s ease; }
        .agc-row.user { justify-content: flex-end; }
        .agc-row.ai, .agc-row.system { justify-content: flex-start; }
        @keyframes agc-msgin {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .agc-msg-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          overflow: hidden; flex-shrink: 0;
          border: 1.5px solid #e5e7eb;
        }
        .agc-bubble {
          max-width: 68%; padding: 10px 14px;
          border-radius: 18px; font-size: 13.5px;
          word-break: break-word; line-height: 1.65;
        }
        .agc-bubble.user {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: #fff; border-bottom-right-radius: 5px;
          box-shadow: 0 4px 14px rgba(99,102,241,0.28);
        }
        .agc-bubble.ai {
          background: #fff; color: #1f2937;
          border: 1px solid #e5e7eb; border-bottom-left-radius: 5px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .agc-bubble.system {
          background: #f0fdf4; color: #166534;
          border: 1px solid #bbf7d0; border-radius: 12px; font-size: 12.5px;
        }
        .agc-bubble.error { background: #fff5f5; color: #b91c1c; border-color: #fecaca; }
        .agc-bubble .agc-content { line-height: 1.65; }
        .agc-bubble .agc-content * { line-height: 1.65; margin: 0; }
        .agc-ts { font-size: 10px; color: #d1d5db; margin-top: 2px; display: flex; }
        .agc-ts.user { justify-content: flex-end; }
        .agc-ts.ai, .agc-ts.system { justify-content: flex-start; padding-left: 36px; }

        /* Typing indicator */
        .agc-typing {
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 18px; border-bottom-left-radius: 5px;
          padding: 12px 16px; display: flex; gap: 5px; align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .agc-dot { width: 7px; height: 7px; border-radius: 50%; background: #c7d2fe; animation: agc-bounce 1.2s ease-in-out infinite; }
        .agc-dot:nth-child(2) { animation-delay: 0.18s; background: #a5b4fc; }
        .agc-dot:nth-child(3) { animation-delay: 0.36s; background: #818cf8; }
        @keyframes agc-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }

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
          font-family: 'DM Sans', sans-serif; transition: background 0.15s;
        }
        .agc-approve:hover { background: #d1fae5; }
        .agc-approve:disabled { opacity: 0.5; cursor: not-allowed; }
        .agc-reject {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 14px; border-radius: 8px;
          background: #fff5f5; border: 1px solid #fca5a5;
          color: #b91c1c; font-size: 12px; font-weight: 500; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: background 0.15s;
        }
        .agc-reject:hover { background: #fee2e2; }
        .agc-reject:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Input zone */
        .agc-input-zone {
          background: #fff; border-top: 1px solid #eaecf0;
          padding: 12px 16px 16px;
          flex-shrink: 0;
        }
        .agc-file-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
        .agc-chip {
          display: flex; align-items: center; gap: 5px;
          background: #eef2ff; border: 1px solid #c7d2fe;
          border-radius: 8px; padding: 3px 8px;
          font-size: 11.5px; color: #4f46e5;
        }
        .agc-chip-x { background: none; border: none; color: #a5b4fc; cursor: pointer; font-size: 13px; padding: 0; transition: color 0.15s; }
        .agc-chip-x:hover { color: #ef4444; }
        .agc-input-wrap {
          display: flex; align-items: center; gap: 8px;
          background: #f9fafb; border: 1.5px solid #e5e7eb;
          border-radius: 14px; padding: 7px 10px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .agc-input-wrap:focus-within {
          border-color: #a5b4fc;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
          background: #fff;
        }
        .agc-icon-btn {
          background: none; border: none; color: #d1d5db;
          cursor: pointer; padding: 5px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; flex-shrink: 0; transition: color 0.15s, background 0.15s;
        }
        .agc-icon-btn:hover { color: #9ca3af; background: #f3f4f6; }
        .agc-icon-btn.recording { color: #ef4444; animation: agc-pulse-red 1s ease-in-out infinite; }
        @keyframes agc-pulse-red { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .agc-text-input {
          flex: 1; background: none; border: none; outline: none;
          color: #111827; font-size: 13.5px;
          font-family: 'DM Sans', sans-serif; padding: 4px 0;
        }
        .agc-text-input::placeholder { color: #d1d5db; }
        .agc-divider { width: 1px; height: 18px; background: #e5e7eb; flex-shrink: 0; }
        .agc-send-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          border: none; color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(99,102,241,0.3); transition: all 0.18s;
        }
        .agc-send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(99,102,241,0.38); }
        .agc-send-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

        .agc-spinner {
          width: 11px; height: 11px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff; border-radius: 50%;
          animation: agc-spin 0.65s linear infinite;
        }
        @keyframes agc-spin { to { transform: rotate(360deg); } }

        /* Responsive for 2K/4K */
        @media (min-width: 2560px) {
          .agc-avatar-panel { width: 480px; padding: 36px 32px; }
          .agc-avatar-stage { flex: 1; }
          .agc-avatar-name-badge { font-size: 22px; }
          .agc-header { padding: 14px 40px; }
          .agc-chat-header { padding: 18px 28px; }
          .agc-messages { padding: 28px 32px; }
          .agc-input-zone { padding: 18px 28px 22px; }
          .agc-bubble { font-size: 16px; max-width: 65%; }
          .agc-send-btn { font-size: 15px; padding: 10px 24px; }
          .agc-text-input { font-size: 15px; }
        }
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
            {isAvatarActive && (
              <span className="agc-timer">⏱ {fmt(sessionDuration)}</span>
            )}
            {isAvatarActive && (
              <button className="agc-hbtn agc-hbtn-neutral" onClick={handleInterrupt} disabled={!isPlaying}>
                ⏸ Interrupt
              </button>
            )}
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="agc-body">

          {/* ══ LEFT: AVATAR PANEL — full-body rectangle ══ */}
          <div className="agc-avatar-panel">

            {/* Full-height avatar stage */}
            <div className="agc-avatar-stage">

              {/* Speaking glow border */}
              <div className={`agc-speaking-ring ${isPlaying ? 'active' : ''}`} />

              {/* Hidden video source for chroma key */}
              <video
                ref={videoRef}
                autoPlay playsInline muted
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
              />

              {/* Chroma-keyed canvas — full body */}
              {hasVideo && (
                <canvas
                  ref={canvasRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',  /* contain = show full body, no cropping */
                    display: 'block',
                    background: '#f8fafc',
                  }}
                />
              )}

              {/* Idle / loading state */}
              {!hasVideo && (
                <div className="agc-avatar-idle">
                  {isLoadingSession ? (
                    <>
                      <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'agc-spin 0.8s linear infinite' }} />
                      <span style={{ color: '#6366f1', fontSize: 13, fontWeight: 500 }}>Connecting…</span>
                    </>
                  ) : (
                    <>
                      {avatarImg
                        ? <img src={avatarImg} alt={avatarName} className="agc-avatar-idle-img" />
                        : <div className="agc-avatar-idle-placeholder">{(avatarName[0] ?? 'A').toUpperCase()}</div>
                      }
                      <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 500 }}>{avatarName}</span>
                    </>
                  )}
                </div>
              )}

              {/* ── TOP BAR: buttons overlaid on image ── */}
              <div className="agc-avatar-top-bar">
                {/* Left: status pill */}
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: '#f3f4f6',
                  padding: '4px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600, color: '#374151',
                  border: '1px solid #e5e7eb',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isPlaying ? '#10b981' : isListening ? '#ef4444' : isTyping ? '#6366f1' : isAvatarActive ? '#10b981' : '#6b7280',
                  }} />
                  {isPlaying ? 'Speaking' : isListening ? 'Listening' : isTyping ? 'Thinking' : isAvatarActive ? 'Ready' : 'Inactive'}
                </span>

                {/* Right: action buttons */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {!isAvatarActive ? (
                    <button
                      className="agc-overlay-btn agc-overlay-btn-green"
                      onClick={startSession}
                      disabled={isLoadingSession}
                    >
                      {isLoadingSession
                        ? <><div className="agc-spinner" style={{ width: 8, height: 8, borderTopColor: '#6ee7b7' }} /> Starting…</>
                        : <>▶ Start Session</>
                      }
                    </button>
                  ) : (
                    <>
                      {audioBlocked && (
                        <button className="agc-overlay-btn agc-overlay-btn-amber" onClick={handleUnmuteAudio}>
                          🔇 Unmute
                        </button>
                      )}
                      <button className="agc-overlay-btn agc-overlay-btn-white" onClick={handleMuteToggle}>
                        {muted ? '🔇' : '🔊'}
                      </button>
                      <button className="agc-overlay-btn agc-overlay-btn-white" onClick={handleInterrupt} disabled={!isPlaying}>
                        ⏸ Pause
                      </button>
                      <button
                        className="agc-overlay-btn agc-overlay-btn-green"
                        onClick={startListening}
                        disabled={isListening || isTyping}
                      >
                        <FaMicrophone size={10} />
                        {isListening ? 'Listening…' : 'Speak'}
                      </button>
                      <button className="agc-overlay-btn agc-overlay-btn-red" onClick={endSession}>
                        ⏹ End
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── BOTTOM BAR: name + status ── */}
              <div className="agc-avatar-info-bar">
                <div className="agc-avatar-name-badge">{avatarName}</div>
                <div className="agc-avatar-status-row">
                  {isAvatarActive && (
                    <span style={{
                      fontSize: 11, color: '#6ee7b7', fontWeight: 600,
                      background: '#ecfdf5',
                      padding: '2px 8px', borderRadius: 10,
                      border: '1px solid #6ee7b7',
                    }}>
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

            </div>{/* end agc-avatar-stage */}
          </div>

          {/* ══ RIGHT: CHAT PANEL ══ */}
          <div className="agc-chat-panel">

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
                    <div className="agc-status-dot" />
                    Online · Ready to help
                  </div>
                </div>
              </div>
              <button className="agc-hbtn agc-hbtn-red" onClick={handleClearChat}>
                <IoClose style={{ fontSize: 13 }} /> Clear chat
              </button>
            </div>

            <div className="agc-messages">
              {messages.length === 0 && showWelcomeMessage ? (
                <div className="agc-welcome">
                  {avatarImg ? (
                    <div className="agc-welcome-orb">
                      <img src={avatarImg} alt={avatarName} className="w-full h-full object-cover object-top" />
                    </div>
                  ) : (
                    <div className="agc-welcome-orb-icon">
                      <span style={{ fontSize: 28 }}>✨</span>
                    </div>
                  )}
                  <div className="agc-welcome-title">
                    {loadingAgent ? 'Loading agent…' : `How may I help you?`}
                  </div>
                  <div className="agc-welcome-sub">
                    {agent?.description || agent?.role || 'Your intelligent license agent'}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(message => (
                    <div key={message.id}>
                      <div className={`agc-row ${message.sender}`}>
                        {(message.sender === 'ai' || message.sender === 'system') && (
                          <div className="agc-msg-avatar">
                            <AvatarImg src={avatarImg} name={avatarName} size={28} />
                          </div>
                        )}
                        <div className={`agc-bubble ${message.sender}${message.isError ? ' error' : ''}`}>
                          <div className="agc-content" dangerouslySetInnerHTML={{ __html: message.text }} />
                          {message.files && message.files.length > 0 && (
                            <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                              📎 {message.files.join(', ')}
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
                      <div className="agc-msg-avatar">
                        <AvatarImg src={avatarImg} name={avatarName} size={28} />
                      </div>
                      <div className="agc-typing">
                        <div className="agc-dot" /><div className="agc-dot" /><div className="agc-dot" />
                      </div>
                    </div>
                  )}

                  {pendingApproval && (
                    <div className="agc-row ai">
                      <div className="agc-msg-avatar">
                        <AvatarImg src={avatarImg} name={avatarName} size={28} />
                      </div>
                      <div className="agc-approval">
                        <div className="agc-approval-title">
                          🔐 Approve license installation for{' '}
                          <strong style={{ color: '#4f46e5' }}>{pendingApproval.filename}</strong>?
                        </div>
                        <div className="agc-approval-actions">
                          <button className="agc-approve"
                            onClick={() => handleApprovalButtonClick('approve')}
                            disabled={approvalProcessing}>
                            {approvalProcessing
                              ? <div className="agc-spinner" style={{ borderTopColor: '#065f46', width: 10, height: 10 }} />
                              : '✓'}
                            Approve
                          </button>
                          <button className="agc-reject"
                            onClick={() => handleApprovalButtonClick('reject')}
                            disabled={approvalProcessing}>
                            {approvalProcessing
                              ? <div className="agc-spinner" style={{ borderTopColor: '#b91c1c', width: 10, height: 10 }} />
                              : '✗'}
                            Reject
                          </button>
                        </div>
                        {pendingApproval.expires_at && (
                          <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 8 }}>
                            Expires {new Date(pendingApproval.expires_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="agc-input-zone">
              {attachedFiles.length > 0 && (
                <div className="agc-file-chips">
                  {attachedFiles.map((file, i) => (
                    <div key={i} className="agc-chip">
                      <span>📎</span>
                      <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <button className="agc-chip-x" onClick={() => handleRemoveFile(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <input ref={fileInputRef} type="file" onChange={handleFileSelect} multiple
                accept=".lic,.txt,.pem,.crt,.key,.license" style={{ display: 'none' }} />

              <div className="agc-input-wrap">
                <button className="agc-icon-btn" onClick={handleAttachClick} title="Attach file">
                  <IoAttachOutline />
                </button>

                <input
                  type="text"
                  className="agc-text-input"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={isAvatarActive ? `Ask ${avatarName} anything…` : 'Type your message…'}
                  disabled={isTyping}
                />

                <button
                  className={`agc-icon-btn ${isListening ? 'recording' : ''}`}
                  onClick={startListening}
                  disabled={isListening || isTyping}
                  title={isListening ? 'Listening…' : 'Voice input'}
                >
                  <FaMicrophone />
                </button>

                <div className="agc-divider" />

                <button className="agc-send-btn" onClick={handleSend} disabled={isTyping || !inputValue.trim()}>
                  {isTyping ? (
                    <><div className="agc-spinner" /> Sending…</>
                  ) : (
                    <><FaPaperPlane size={12} /> Send</>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AgentChat; 