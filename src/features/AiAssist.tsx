import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoClose, IoPause, IoPlay, IoStop } from "react-icons/io5";
import { FaArrowLeft, FaMicrophone, FaPaperPlane } from "react-icons/fa";
import {
  Room,
  RoomEvent,
  RemoteTrack,
  Track,
  RemoteTrackPublication,
  RemoteParticipant,
  DataPacket_Kind,
} from 'livekit-client';

// Female avatar name hints — picks first match from public list
const FEMALE_HINTS = ['ann', 'judy', 'june', 'elenora', 'sarah', 'emma', 'lisa', 'anna', 'amy', 'kate', 'jessica', 'sophia', 'olivia', 'ella', 'silas'];

interface LocationState { script?: string; chatHistory?: Record<string, any>; }
interface ConvMsg       { type: 'user' | 'assistant'; text: string; }
interface AiMsg         { role: 'user' | 'assistant'; content: string; }

interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; resultIndex: number; }
interface SpeechRecognitionErrorEvent extends Event { error: string; message: string; }
interface SpeechRecognitionResultList { length: number; item(i: number): SpeechRecognitionResult; [i: number]: SpeechRecognitionResult; }
interface SpeechRecognitionResult { length: number; item(i: number): SpeechRecognitionAlternative; [i: number]: SpeechRecognitionAlternative; isFinal: boolean; }
interface SpeechRecognitionAlternative { transcript: string; confidence: number; }
interface SpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror:  ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend:    (() => void) | null;
  onstart:  (() => void) | null;
}
interface SpeechRecognitionConstructor { new(): SpeechRecognition; }
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
const AiAssist: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scriptFromChat =
    (location.state as LocationState)?.script ||
    'Hello! I am Astra, your Ping Federate assistant. How can I help you today?';

  /* ── state ── */
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isAvatarActive,   setIsAvatarActive]   = useState(false);
  const [isPlaying,        setIsPlaying]        = useState(false);
  const [isPaused,         setIsPaused]         = useState(false);
  const [caption,          setCaption]          = useState('');
  const [showCaption,      setShowCaption]      = useState(true);
  const [debug,            setDebug]            = useState('');
  const [conversation,     setConversation]     = useState<ConvMsg[]>([]);
  const [userInput,        setUserInput]        = useState('');
  const [isListening,      setIsListening]      = useState(false);
  const [isProcessing,     setIsProcessing]     = useState(false);
  const [sessionDuration,  setSessionDuration]  = useState(0);
  const [showChat,         setShowChat]         = useState(false);
  const [hasVideo,         setHasVideo]         = useState(false);
  const [audioBlocked,     setAudioBlocked]     = useState(false);

  /* ── refs ── */
  const roomRef           = useRef<Room | null>(null);
  const sessionIdRef      = useRef<string | null>(null);
  const sessionTokenRef   = useRef<string | null>(null);
  const videoRef          = useRef<HTMLVideoElement>(null);
  // ✅ We collect ALL audio tracks into one MediaStream — no more overwriting
  const audioTracksRef    = useRef<MediaStreamTrack[]>([]);
  const audioElRef        = useRef<HTMLAudioElement | null>(null);
  const hasSpokenInit     = useRef(false);
  const recognitionRef    = useRef<SpeechRecognition | null>(null);
  const timerRef          = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef        = useRef<HTMLDivElement>(null);
  const hasStartedRef     = useRef(false);

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Audio helpers                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */

  /** Rebuild the audio element srcObject from all collected tracks */
  const rebuildAudio = useCallback(() => {
    if (!audioTracksRef.current.length) return;

    // Create audio element lazily so it's not in the React tree
    // (avoids autoplay policy issues with elements created before user gesture)
    if (!audioElRef.current) {
      audioElRef.current = new Audio();
      audioElRef.current.autoplay = true;
      audioElRef.current.volume   = 1.0;
    }

    const ms = new MediaStream(audioTracksRef.current);
    audioElRef.current.srcObject = ms;

    audioElRef.current.play()
      .then(() => { setAudioBlocked(false); console.log('🔊 Audio playing'); })
      .catch(err => {
        console.warn('Audio autoplay blocked:', err);
        setAudioBlocked(true);
      });
  }, []);

  const handleUnmuteAudio = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.play()
        .then(() => setAudioBlocked(false))
        .catch(console.error);
    }
  }, []);

  /* ─────────────────────────────────────────────────────────────────────── */
  /* API helpers                                                              */
  /* ─────────────────────────────────────────────────────────────────────── */
  const getApiKey = (): string => {
    const key = import.meta.env.VITE_LIVEAVATAR_API_KEY || import.meta.env.VITE_HEYGEN_API_KEY;
    if (!key) throw new Error('NO_API_KEY');
    return key;
  };

  /** Fetch avatars and pick a female one by name */
  const fetchAvatarInfo = async (apiKey: string): Promise<{ id: string; voiceId: string | null; name: string }> => {
    setDebug('Fetching avatars...');
    const res  = await fetch('https://api.liveavatar.com/v1/avatars/public', {
      headers: { 'X-API-KEY': apiKey, accept: 'application/json' },
    });
    const data = await res.json();
    const list: any[] = data?.data?.results ?? [];
    if (!list.length) throw new Error('NO_AVATARS');

    // Try to find a female avatar by name
    const female = list.find((a: any) =>
      FEMALE_HINTS.some(hint => (a.name ?? '').toLowerCase().includes(hint))
    );
    const chosen = female ?? list[0];
    console.log('✅ Avatar chosen:', chosen.name, '|', chosen.id);
    return {
      id:      chosen.id ?? chosen.avatar_id,
      voiceId: chosen.default_voice?.id ?? null,
      name:    chosen.name ?? 'Avatar',
    };
  };

  const createSessionToken = async (apiKey: string, avatarId: string, voiceId: string | null) => {
    setDebug('Creating session token...');
    const res = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'FULL',
        avatar_id: avatarId,
        avatar_persona: { language: 'en', voice_id: voiceId },
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`SESSION_TOKEN_${res.status}: ${text}`);
    const parsed = JSON.parse(text);
    return { session_id: parsed.data.session_id as string, session_token: parsed.data.session_token as string };
  };

  const startLiveAvatarSession = async (token: string) => {
    setDebug('Starting session...');
    const res = await fetch('https://api.liveavatar.com/v1/sessions/start', {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`SESSION_START_${res.status}: ${text}`);
    const parsed = JSON.parse(text);
    return {
      livekit_url:          parsed.data.livekit_url as string,
      livekit_client_token: parsed.data.livekit_client_token as string,
    };
  };

  const stopServerSession = async (token: string) => {
    try {
      await fetch('https://api.liveavatar.com/v1/sessions/stop', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
    } catch (e) { console.warn('Stop session failed:', e); }
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /* LiveKit data channel                                                     */
  /* ─────────────────────────────────────────────────────────────────────── */
  const publishCommand = useCallback(async (payload: Record<string, any>) => {
    const room = roomRef.current;
    if (!room || room.state !== 'connected') { console.warn('Room not connected'); return; }
    const data = new TextEncoder().encode(JSON.stringify(payload));
    await room.localParticipant.publishData(data, { kind: DataPacket_Kind.RELIABLE, topic: 'agent-control' });
    console.log('📤 agent-control:', payload);
  }, []);

  const handleSpeak = useCallback(async (text: string) => {
    if (!text.trim() || !isAvatarActive) return;
    setCaption(text); setShowCaption(true); setDebug('Speaking…');
    await publishCommand({ event_type: 'avatar.speak_text', session_id: sessionIdRef.current, text });
  }, [isAvatarActive, publishCommand]);

  const handleInterrupt = useCallback(async () => {
    await publishCommand({ event_type: 'avatar.interrupt', session_id: sessionIdRef.current });
    setIsPlaying(false); setIsPaused(false);
  }, [publishCommand]);

  /* ─────────────────────────────────────────────────────────────────────── */
  /* endSession                                                               */
  /* ─────────────────────────────────────────────────────────────────────── */
  const endSession = useCallback(async () => {
    if (roomRef.current) {
      try { await roomRef.current.disconnect(); } catch (_) {}
      roomRef.current = null;
    }
    const token = sessionTokenRef.current;
    if (token) await stopServerSession(token);

    if (videoRef.current)     { videoRef.current.srcObject = null; }
    if (audioElRef.current)   { audioElRef.current.srcObject = null; audioElRef.current.pause(); }

    audioTracksRef.current  = [];
    sessionTokenRef.current = null;
    sessionIdRef.current    = null;
    setHasVideo(false);
    setIsAvatarActive(false);
    setIsPlaying(false);
    setIsPaused(false);
    setCaption('');
    hasSpokenInit.current = false;
    setDebug('Session ended');
  }, []);

  /* ─────────────────────────────────────────────────────────────────────── */
  /* startSession                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */
  const startSession = useCallback(async () => {
    setIsLoadingSession(true);
    audioTracksRef.current = []; // reset tracks

    try {
      if (sessionTokenRef.current) await stopServerSession(sessionTokenRef.current);
      if (roomRef.current) { try { await roomRef.current.disconnect(); } catch (_) {} roomRef.current = null; }

      const apiKey = getApiKey();
      const { id: avatarId, voiceId } = await fetchAvatarInfo(apiKey);
      const { session_id, session_token } = await createSessionToken(apiKey, avatarId, voiceId);
      const { livekit_url, livekit_client_token } = await startLiveAvatarSession(session_token);

      sessionIdRef.current    = session_id;
      sessionTokenRef.current = session_token;

      setDebug('Connecting to LiveKit...');

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      /* ── Track subscription ── */
      room.on(RoomEvent.TrackSubscribed, (
        track: RemoteTrack,
        _pub: RemoteTrackPublication,
        _participant: RemoteParticipant,
      ) => {
        console.log('Track subscribed:', track.kind, track.sid);

        if (track.kind === Track.Kind.Video) {
          // ✅ srcObject approach — video element always in DOM
          if (videoRef.current) {
            videoRef.current.srcObject = new MediaStream([track.mediaStreamTrack]);
            videoRef.current.play().catch(e => console.warn('video play err:', e));
          }
          setHasVideo(true);
          setDebug('Stream connected ✅');

        } else if (track.kind === Track.Kind.Audio) {
          // ✅ AUDIO FIX: Collect every audio track into an array,
          // then rebuild a single MediaStream with ALL tracks.
          // This prevents later tracks from silently overwriting earlier ones.
          audioTracksRef.current.push(track.mediaStreamTrack);
          console.log(`🎵 Audio track added (total: ${audioTracksRef.current.length})`);
          rebuildAudio();

          // Also handle track ending — rebuild without it
          track.mediaStreamTrack.addEventListener('ended', () => {
            audioTracksRef.current = audioTracksRef.current.filter(
              t => t.id !== track.mediaStreamTrack.id
            );
            rebuildAudio();
          });
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Video) {
          if (videoRef.current) videoRef.current.srcObject = null;
          setHasVideo(false);
        } else if (track.kind === Track.Kind.Audio) {
          // Remove unsubscribed track and rebuild
          audioTracksRef.current = audioTracksRef.current.filter(
            t => t.id !== track.mediaStreamTrack.id
          );
          rebuildAudio();
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        setDebug('Disconnected'); setIsAvatarActive(false); setHasVideo(false);
      });

      /* ── Server events ── */
      room.on(RoomEvent.DataReceived, (payload: Uint8Array, _p: any, _k: any, topic?: string) => {
        try {
          const msg  = JSON.parse(new TextDecoder().decode(payload));
          const type = msg.event_type ?? msg.type ?? '';
          console.log(`📩 [${topic ?? 'no-topic'}] ${type}`, msg);

          if      (type === 'avatar.speak_started' || type === 'avatar_start_talking')
            { setIsPlaying(true);  setIsPaused(false); setDebug('Speaking…'); }
          else if (type === 'avatar.speak_ended'   || type === 'avatar_stop_talking')
            { setIsPlaying(false); setDebug('Ready'); }
          else if (type === 'avatar.transcription' || type === 'avatar.transcription.chunk')
            { if (msg.text) setCaption(msg.text); }
          else if (type === 'user.transcription')
            { if (msg.text) setUserInput(msg.text); }
          else if (type === 'session.stopped')
            { setDebug(`Session stopped: ${msg.end_reason}`); endSession(); }
        } catch (_) {}
      });

      await room.connect(livekit_url, livekit_client_token);
      console.log('✅ Connected to LiveKit room');
      setIsAvatarActive(true);
      setDebug('Avatar ready ✅');

    } catch (err: any) {
      console.error('startSession error:', err);
      setDebug(`Error: ${err.message}`);
      let msg = '';
      if (err.message === 'NO_API_KEY')                     msg = '❌ API key missing!\n\nAdd VITE_LIVEAVATAR_API_KEY to .env, then restart.';
      else if (err.message === 'NO_AVATARS')                msg = '❌ No avatars found.\n\nGo to https://app.liveavatar.com → Avatars.';
      else if (err.message.startsWith('SESSION_TOKEN_401')) msg = '❌ API key rejected (401).\n\nCheck your VITE_LIVEAVATAR_API_KEY in .env.';
      else                                                   msg = `❌ Error: ${err.message}`;
      if (msg) alert(msg);
    } finally {
      setIsLoadingSession(false);
    }
  }, [endSession, rebuildAudio]);

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Claude AI response                                                       */
  /* ─────────────────────────────────────────────────────────────────────── */
  const getAIResponse = useCallback(async (question: string): Promise<string> => {
    try {
      const msgs: AiMsg[] = [
        ...conversation.slice(-6).map(m => ({
          role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.text,
        })),
        { role: 'user', content: question },
      ];
      const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!key) throw new Error('VITE_ANTHROPIC_API_KEY missing');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: msgs,
          system: 'You are Astra, a helpful Ping Federate assistant. Keep responses conversational and concise (2-3 sentences max).',
        }),
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}`);
      const d = await res.json();
      return d.content[0].text;
    } catch (e) {
      console.error('AI error:', e);
      return "I'm sorry, I encountered an error. Please try again.";
    }
  }, [conversation]);

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Send question                                                            */
  /* ─────────────────────────────────────────────────────────────────────── */
  const handleSendQuestion = useCallback(async (question: string) => {
    if (!question.trim() || !isAvatarActive || isProcessing) return;
    if (isPlaying) await handleInterrupt();

    setConversation(p => [...p, { type: 'user', text: question.trim() }]);
    setUserInput(''); setIsProcessing(true); setDebug('Thinking…');

    try {
      const reply = await getAIResponse(question.trim());
      setConversation(p => [...p, { type: 'assistant', text: reply }]);
      await handleSpeak(reply);
      setDebug('Ready');
    } catch (_) {
      const err = "I'm sorry, there was an error. Please try again.";
      setConversation(p => [...p, { type: 'assistant', text: err }]);
      await handleSpeak(err);
    } finally { setIsProcessing(false); }
  }, [isAvatarActive, isProcessing, isPlaying, getAIResponse, handleSpeak, handleInterrupt]);

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Effects                                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recognitionRef.current = new SR();
    recognitionRef.current.continuous     = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang           = 'en-US';
    recognitionRef.current.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0][0].transcript;
      setUserInput(t); setIsListening(false); handleSendQuestion(t);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend   = () => setIsListening(false);
  }, [handleSendQuestion]);

  useEffect(() => {
    if (isAvatarActive) { timerRef.current = setInterval(() => setSessionDuration(s => s + 1), 1000); }
    else { if (timerRef.current) clearInterval(timerRef.current); setSessionDuration(0); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isAvatarActive]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startSession();
    return () => { endSession(); };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isAvatarActive && scriptFromChat && !hasSpokenInit.current) {
      hasSpokenInit.current = true;
      setTimeout(() => {
        handleSpeak(scriptFromChat);
        setConversation([{ type: 'assistant', text: scriptFromChat }]);
      }, 1000);
    }
  }, [isAvatarActive, scriptFromChat, handleSpeak]);

  useEffect(() => {
    const cleanup = () => {
      const token = sessionTokenRef.current;
      if (token) fetch('https://api.liveavatar.com/v1/sessions/stop', {
        method: 'POST', keepalive: true,
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }).catch(() => {});
    };
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, []);

  /* ─────────────────────────────────────────────────────────────────────── */
  /* UI handlers                                                              */
  /* ─────────────────────────────────────────────────────────────────────── */
  const startListening = () => {
    if (!recognitionRef.current || isListening || isProcessing) return;
    if (isPlaying) handleInterrupt();
    setIsListening(true); setDebug('Listening…');
    recognitionRef.current.start();
  };

  const handleBack = useCallback(() => {
    if (isAvatarActive) endSession();
    navigate('/agents/agentchat');
  }, [navigate, isAvatarActive, endSession]);

  const handleClearChat = useCallback(async () => {
    if (!isAvatarActive) return;
    await handleInterrupt();
    setCaption(''); setShowCaption(false); setConversation([]); setDebug('Cleared');
  }, [isAvatarActive, handleInterrupt]);

  const handlePause = useCallback(async () => {
    if (!isPlaying) return;
    await handleInterrupt(); setIsPaused(true);
  }, [isPlaying, handleInterrupt]);

  const handlePlay = useCallback(async () => {
    if (!isAvatarActive || isPlaying) return;
    await handleSpeak(caption || scriptFromChat);
  }, [isPlaying, isAvatarActive, caption, scriptFromChat, handleSpeak]);

  const handleStop = useCallback(async () => {
    await handleInterrupt(); setCaption(''); setShowCaption(false);
  }, [handleInterrupt]);

  const handleRestartSession = useCallback(() => {
    if (isAvatarActive) { endSession().then(() => setTimeout(startSession, 1000)); }
    else { startSession(); }
  }, [isAvatarActive, endSession, startSession]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Render — exact same UI as before                                         */
  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="w-full h-screen flex flex-col bg-[#F9FAFB] overflow-hidden">

      {/* Header */}
      <div className="px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between flex-shrink-0 border-b border-gray-200">
        <button onClick={handleBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <FaArrowLeft size={16} /><span className="text-sm">Back</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAvatarActive && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-xs font-medium text-gray-600">⏱️ {fmt(sessionDuration)}</span>
            </div>
          )}
          {isAvatarActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700">Live</span>
            </div>
          )}
          {audioBlocked && (
            <button onClick={handleUnmuteAudio}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm font-medium animate-pulse">
              🔇 Tap to Unmute
            </button>
          )}
          <button onClick={() => setShowChat(v => !v)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-2 transition-colors text-xs sm:text-sm font-medium">
            💬 {showChat ? 'Hide' : 'Show'} Chat
          </button>
          <button onClick={handleClearChat}
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-2 transition-colors">
            <IoClose className="text-sm sm:text-base" />
            <span className="text-xs sm:text-sm font-medium">Clear</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">

        {/* Avatar side */}
        <div className={`${showChat ? 'w-1/2' : 'w-full'} flex items-center justify-center px-4 py-4 sm:py-6 transition-all duration-300`}>
          <div className="w-full max-w-2xl flex flex-col items-center justify-center gap-4">

            {/* Avatar circle — video always in DOM */}
            <div className="relative">
              <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-full overflow-hidden shadow-2xl border-4 border-white bg-gray-900 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ display: hasVideo ? 'block' : 'none' }}
                />
                {!hasVideo && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    {isLoadingSession ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
                        <p className="text-white text-sm font-medium">Loading Avatar…</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-white text-6xl">👤</div>
                        <button onClick={handleRestartSession}
                          className="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                          Start Session
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isPlaying    && <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">🎤 Speaking</div>}
              {isListening  && <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">🎙️ Listening</div>}
              {isProcessing && <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">⚡ Processing</div>}
            </div>

            {/* Caption */}
            {showCaption && caption && !showChat && (
              <div className="relative w-full max-w-xl">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 relative">
                  <button onClick={() => setShowCaption(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><IoClose /></button>
                  <p className="text-gray-700 text-sm leading-relaxed pr-6">"{caption}"</p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              <button onClick={handlePause} disabled={!isPlaying || !isAvatarActive}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm font-medium">
                <IoPause /> Pause
              </button>
              <button onClick={handlePlay} disabled={isPlaying || !isAvatarActive}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm font-medium">
                <IoPlay /> {isPaused ? 'Resume' : 'Play'}
              </button>
              <button onClick={handleStop} disabled={!isAvatarActive}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm font-medium">
                <IoStop /> Stop
              </button>
            </div>

            {import.meta.env.DEV && debug && (
              <div className="px-4 py-2 bg-gray-800 text-white text-xs rounded-lg max-w-lg text-center">{debug}</div>
            )}
          </div>
        </div>

        {/* Chat side */}
        {showChat && (
          <div className="w-1/2 border-l border-gray-200 flex flex-col bg-white">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Conversation</h3>
              <p className="text-xs text-gray-600 mt-1">Ask questions and get AI-powered responses</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversation.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-gray-400">
                  <div>
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-sm">Start a conversation</p>
                    <p className="text-xs mt-1">Type or use voice input</p>
                  </div>
                </div>
              ) : (
                <>
                  {conversation.map((msg, i) => (
                    <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <div className="text-xs font-semibold mb-1 opacity-75">
                          {msg.type === 'user' ? '👤 You' : '🤖 Astra'}
                        </div>
                        <div className="text-sm leading-relaxed">{msg.text}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text" value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && !isProcessing && handleSendQuestion(userInput)}
                  placeholder="Type your question…"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isProcessing || isListening || !isAvatarActive}
                />
                <button onClick={() => handleSendQuestion(userInput)}
                  disabled={isProcessing || !userInput.trim() || isListening || !isAvatarActive}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <FaPaperPlane />
                </button>
                <button onClick={startListening}
                  disabled={isProcessing || isListening || !isAvatarActive}
                  className={`${isListening ? 'bg-red-600 animate-pulse' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}>
                  <FaMicrophone />
                </button>
              </div>
              {!isAvatarActive && (
                <p className="text-xs text-red-600 mt-2">Avatar not active. Please wait…</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssist;