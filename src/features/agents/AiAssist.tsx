// import React, { useState, useCallback, useRef, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { IoClose, IoPause, IoPlay, IoStop } from "react-icons/io5";
// import { FaArrowLeft, FaMicrophone, FaPaperPlane } from "react-icons/fa";
// import StreamingAvatar, {
//   AvatarQuality,
//   StreamingEvents,
//   TaskType,
//   TaskMode,
// } from '@heygen/streaming-avatar';

// interface LocationState {
//   script?: string;
//   latestResponse?: string;
//   chatHistory?: Record<string, any>;
//   avatarImg?: string;
//   avatarName?: string;
//   avatarId?: string;
// }

// interface ConvMsg { type: 'user' | 'assistant'; text: string; }
// interface AiMsg   { role: 'user' | 'assistant'; content: string; }

// interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; resultIndex: number; }
// interface SpeechRecognitionErrorEvent extends Event { error: string; message: string; }
// interface SpeechRecognitionResultList { length: number; item(i: number): SpeechRecognitionResult; [i: number]: SpeechRecognitionResult; }
// interface SpeechRecognitionResult { length: number; item(i: number): SpeechRecognitionAlternative; [i: number]: SpeechRecognitionAlternative; isFinal: boolean; }
// interface SpeechRecognitionAlternative { transcript: string; confidence: number; }
// interface SpeechRecognition extends EventTarget {
//   continuous: boolean; interimResults: boolean; lang: string;
//   start(): void; stop(): void; abort(): void;
//   onresult: ((e: SpeechRecognitionEvent) => void) | null;
//   onerror:  ((e: SpeechRecognitionErrorEvent) => void) | null;
//   onend:    (() => void) | null;
//   onstart:  (() => void) | null;
// }
// interface SpeechRecognitionConstructor { new(): SpeechRecognition; }
// declare global {
//   interface Window {
//     SpeechRecognition?: SpeechRecognitionConstructor;
//     webkitSpeechRecognition?: SpeechRecognitionConstructor;
//   }
// }

// const KNOWN_STREAMING_AVATARS: Record<string, string[]> = {
//   marianne:   ['Marianne_ProfessionalLook_public', 'marianne_front_public'],
//   katya:      ['Katya_ProfessionalLook_public', 'katya_front_public'],
//   alessandra: ['Alessandra_ProfessionalLook_public'],
//   tyler:      ['Tyler-incasualsuit-20220722', 'Tyler_ProfessionalLook_public', 'tyler_front_public'],
//   anna:       ['Anna_public_3_20240108', 'Anna_ProfessionalLook_public'],
//   eric:       ['Eric_public_pro1_20230608', 'Eric_ProfessionalLook_public'],
//   susan:      ['Susan_public_2_20240328', 'Susan_ProfessionalLook_public'],
//   josh:       ['Josh_lite_20230714', 'Josh_ProfessionalLook_public'],
//   shelly:     ['Shelly_public_20240408'],
//   wayne:      ['Wayne_20240711_public'],
//   thaddeus:   ['Thaddeus_ProfessionalLook_public', 'Thaddeus-incasualsuit-20220722'],
// };

// const DEFAULT_STREAMING_AVATAR = 'Marianne_ProfessionalLook_public';

// const AiAssist: React.FC = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const state    = location.state as LocationState | null;

//   const scriptToSpeak =
//     state?.latestResponse ||
//     state?.script ||
//     'Hello! I am your AI assistant. How can I help you today?';

//   const passedAvatarId   = state?.avatarId   || '';
//   const passedAvatarImg  = state?.avatarImg  || '';
//   const passedAvatarName = state?.avatarName || 'Astra';

//   const [isLoadingSession, setIsLoadingSession] = useState(false);
//   const [isAvatarActive,   setIsAvatarActive]   = useState(false);
//   const [hasVideo,         setHasVideo]         = useState(false);
//   const [isPlaying,        setIsPlaying]        = useState(false);
//   const [isPaused,         setIsPaused]         = useState(false);
//   const [caption,          setCaption]          = useState('');
//   const [showCaption,      setShowCaption]      = useState(true);
//   const [debugLines,       setDebugLines]       = useState<string[]>([]);
//   const [conversation,     setConversation]     = useState<ConvMsg[]>([]);
//   const [userInput,        setUserInput]        = useState('');
//   const [isListening,      setIsListening]      = useState(false);
//   const [isProcessing,     setIsProcessing]     = useState(false);
//   const [sessionDuration,  setSessionDuration]  = useState(0);
//   const [showChat,         setShowChat]         = useState(false);
//   const [audioBlocked,     setAudioBlocked]     = useState(false);
//   const [resolvedAvatarId, setResolvedAvatarId] = useState<string>('');

//   const avatarRef      = useRef<InstanceType<typeof StreamingAvatar> | null>(null);
//   const videoRef       = useRef<HTMLVideoElement>(null);
//   const canvasRef      = useRef<HTMLCanvasElement>(null);
//   const chromaRafRef   = useRef<number | null>(null);
//   const hasSpokenInit  = useRef(false);
//   const recognitionRef = useRef<SpeechRecognition | null>(null);
//   const timerRef       = useRef<NodeJS.Timeout | null>(null);
//   const chatEndRef     = useRef<HTMLDivElement>(null);
//   const audioTracksRef = useRef<MediaStreamTrack[]>([]);
//   const audioElRef     = useRef<HTMLAudioElement | null>(null);

//   const log = useCallback((msg: string) => {
//     console.log('[AiAssist]', msg);
//     setDebugLines(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev].slice(0, 20));
//   }, []);

//   const rebuildAudio = useCallback(() => {
//     if (!audioTracksRef.current.length) return;
//     if (!audioElRef.current) {
//       audioElRef.current          = new Audio();
//       audioElRef.current.autoplay = true;
//       audioElRef.current.volume   = 1.0;
//     }
//     audioElRef.current.srcObject = new MediaStream(audioTracksRef.current);
//     audioElRef.current.play()
//       .then(() => { setAudioBlocked(false); log('🔊 Audio playing'); })
//       .catch(err => { log(`⚠️ Autoplay blocked: ${err.message}`); setAudioBlocked(true); });
//   }, [log]);

//   const handleUnmuteAudio = useCallback(() => {
//     audioElRef.current?.play().then(() => setAudioBlocked(false)).catch(console.error);
//   }, []);

//   const fetchSessionToken = async (): Promise<string> => {
//     const apiKey = import.meta.env.VITE_HEYGEN_API_KEY;
//     if (!apiKey) throw new Error('NO_API_KEY');

//     const headers    = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };
//     const parseToken = (data: any): string | null =>
//       data?.data?.token ?? data?.token ?? data?.data?.access_token ?? data?.access_token ?? null;

//     for (const endpoint of ['/heygen-api/v1/streaming.create_token', '/heygen-api/v1/realtime.token']) {
//       try {
//         log(`Fetching token from ${endpoint}…`);
//         const r    = await fetch(endpoint, { method: 'POST', headers });
//         const text = await r.text();
//         if (!r.ok) {
//           if (r.status === 401) throw new Error('INVALID_API_KEY');
//           log(`${endpoint} → ${r.status}, trying next…`);
//           continue;
//         }
//         const token = parseToken(JSON.parse(text));
//         if (token) { log(`✅ Token obtained`); return token; }
//       } catch (e: any) {
//         if (e.message === 'INVALID_API_KEY') throw e;
//         log(`${endpoint} failed: ${e.message}`);
//       }
//     }
//     throw new Error('ALL_TOKEN_ENDPOINTS_FAILED');
//   };

//   const resolveStreamingAvatarId = async (): Promise<string> => {
//     const apiKey = import.meta.env.VITE_HEYGEN_API_KEY;

//     log(`Resolving avatar — saved ID: "${passedAvatarId}", name: "${passedAvatarName}"`);

//     let streamingAvatars: Array<{ id: string; name: string }> = [];
//     try {
//       const r = await fetch('/heygen-api/v1/streaming/avatar.list', {
//         headers: { 'x-api-key': apiKey },
//       });
//       if (r.ok) {
//         const data = await r.json();
//         const raw: any[] =
//           Array.isArray(data?.data)           ? data.data :
//           Array.isArray(data?.data?.avatars)  ? data.data.avatars :
//           Array.isArray(data?.avatars)        ? data.avatars :
//           [];

//         streamingAvatars = raw.map((a: any) => ({
//           id:   a.avatar_id   ?? a.id   ?? '',
//           name: (a.avatar_name ?? a.name ?? a.pose_name ?? '').toLowerCase(),
//         })).filter(a => a.id);

//         log(`📋 ${streamingAvatars.length} streaming avatars on your account:`);
//         streamingAvatars.forEach(a => log(`   • ${a.id}`));
//       } else {
//         log(`⚠️ Streaming avatar list returned ${r.status}`);
//       }
//     } catch (e: any) {
//       log(`⚠️ Could not fetch streaming avatar list: ${e.message}`);
//     }

//     if (passedAvatarId && streamingAvatars.length > 0) {
//       const directMatch = streamingAvatars.find(a =>
//         a.id.toLowerCase() === passedAvatarId.toLowerCase()
//       );
//       if (directMatch) {
//         log(`✅ Direct ID match: ${directMatch.id}`);
//         return directMatch.id;
//       }
//       log(`ℹ️ Saved ID "${passedAvatarId}" NOT in streaming list`);
//     }

//     if (passedAvatarName && streamingAvatars.length > 0) {
//       const nameLower = passedAvatarName.toLowerCase()
//         .replace(/\s+agent$/i, '')
//         .replace(/professional\s*look/i, '')
//         .trim();

//       const nameMatch = streamingAvatars.find(a =>
//         a.name.includes(nameLower) ||
//         a.id.toLowerCase().includes(nameLower) ||
//         nameLower.includes(a.name.split('_')[0].toLowerCase())
//       );
//       if (nameMatch) {
//         log(`✅ Name match: "${passedAvatarName}" → ${nameMatch.id}`);
//         return nameMatch.id;
//       }
//       log(`ℹ️ No name match for "${passedAvatarName}"`);
//     }

//     const searchStr = (passedAvatarName + ' ' + passedAvatarId).toLowerCase();
//     for (const [keyword, ids] of Object.entries(KNOWN_STREAMING_AVATARS)) {
//       if (searchStr.includes(keyword)) {
//         for (const id of ids) {
//           if (streamingAvatars.length === 0 || streamingAvatars.some(a => a.id === id)) {
//             log(`✅ Known avatar lookup: "${keyword}" → ${id}`);
//             return id;
//           }
//         }
//       }
//     }

//     if (streamingAvatars.length > 0) {
//       const chosen = streamingAvatars[0];
//       log(`⚠️ No match — using first available: ${chosen.id}`);
//       return chosen.id;
//     }

//     log(`⚠️ No streaming avatars found — hard fallback: ${DEFAULT_STREAMING_AVATAR}`);
//     return DEFAULT_STREAMING_AVATAR;
//   };

//   const endSession = useCallback(async () => {
//     if (!avatarRef.current) return;
//     try { await avatarRef.current.stopAvatar(); } catch (_) {}
//     if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.srcObject = null; }
//     audioTracksRef.current = [];
//     if (videoRef.current) videoRef.current.srcObject = null;
//     avatarRef.current = null; hasSpokenInit.current = false;
//     setHasVideo(false); setIsAvatarActive(false); setIsPlaying(false);
//     setIsPaused(false); setCaption(''); log('Session ended');
//   }, [log]);

//   const startSession = useCallback(async () => {
//     if (isLoadingSession || isAvatarActive) return;
//     setIsLoadingSession(true);
//     audioTracksRef.current = []; hasSpokenInit.current = false;

//     try {
//       const sessionToken = await fetchSessionToken();
//       const avatarId     = await resolveStreamingAvatarId();
//       setResolvedAvatarId(avatarId);

//       log(`Initialising SDK with avatar: ${avatarId}`);
//       avatarRef.current = new StreamingAvatar({ token: sessionToken });

//       avatarRef.current.on(StreamingEvents.STREAM_READY, (event: any) => {
//         const stream: MediaStream = event.detail;
//         log(`STREAM_READY — ${stream.getTracks().map(t => t.kind).join(', ')}`);

//         const videoTracks = stream.getVideoTracks();
//         if (videoTracks.length && videoRef.current) {
//           videoRef.current.srcObject = new MediaStream(videoTracks);
//           videoRef.current.play().catch(e => log(`video.play() error: ${e.message}`));
//           setHasVideo(true); log('✅ Video live');
//         }

//         stream.getAudioTracks().forEach(track => {
//           audioTracksRef.current.push(track);
//           track.addEventListener('ended', () => {
//             audioTracksRef.current = audioTracksRef.current.filter(t => t.id !== track.id);
//             rebuildAudio();
//           });
//         });
//         if (stream.getAudioTracks().length) rebuildAudio();
//       });

//       avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
//         setIsPlaying(true); setIsPaused(false); log('Speaking…');
//       });
//       avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
//         setIsPlaying(false); log('Ready');
//       });
//       avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
//         setHasVideo(false); setIsAvatarActive(false); log('Disconnected');
//       });

//       log(`Starting avatar session…`);
//       const sessionData = await avatarRef.current.createStartAvatar({
//         quality:    AvatarQuality.High,
//         avatarName: avatarId,
//         language:   'en',
//       });
//       log(`✅ Session: ${sessionData?.session_id} | Avatar: ${avatarId}`);
//       setIsAvatarActive(true);

//     } catch (err: any) {
//       log(`❌ Error: ${err.message}`);
//       const msgs: Record<string, string> = {
//         NO_API_KEY:                 '❌ VITE_HEYGEN_API_KEY missing in .env',
//         INVALID_API_KEY:            '❌ HeyGen API key invalid (401)',
//         ALL_TOKEN_ENDPOINTS_FAILED: '❌ Could not reach HeyGen. Check Vite proxy config.',
//       };
//       alert(msgs[err.message] ??
//         (err.message?.includes('400')
//           ? '❌ HeyGen 400 — quota or concurrent session limit. Wait 1 min and retry.'
//           : `❌ ${err.message}`)
//       );
//     } finally {
//       setIsLoadingSession(false);
//     }
//   }, [isLoadingSession, isAvatarActive, rebuildAudio, passedAvatarId, passedAvatarName, log]);

//   const handleSpeak = useCallback(async (text: string) => {
//     if (!avatarRef.current || !isAvatarActive || !text.trim()) return;
//     setCaption(text); setShowCaption(true);
//     try {
//       await avatarRef.current.speak({ text, taskType: TaskType.REPEAT, taskMode: TaskMode.SYNC });
//     } catch (e: any) {
//       log(`Speak error: ${e.message}`);
//     }
//   }, [isAvatarActive, log]);

//   const getAIResponse = useCallback(async (question: string): Promise<string> => {
//     const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
//     if (!key) return "AI service not configured.";
//     try {
//       const msgs: AiMsg[] = [
//         ...conversation.slice(-8).map(m => ({
//           role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
//           content: m.text,
//         })),
//         { role: 'user', content: question },
//       ];
//       const res = await fetch('https://api.anthropic.com/v1/messages', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'x-api-key': key,
//           'anthropic-version': '2023-06-01',
//         },
//         body: JSON.stringify({
//           model: 'claude-sonnet-4-20250514',
//           max_tokens: 500,
//           messages: msgs,
//           system: `You are ${passedAvatarName}, a friendly professional AI assistant. Keep responses conversational and concise — 2 to 3 sentences. Avoid markdown, bullets, or special formatting since your response will be spoken aloud.`,
//         }),
//       });
//       if (!res.ok) throw new Error(`Anthropic ${res.status}`);
//       return (await res.json()).content[0].text;
//     } catch (e: any) {
//       log(`AI error: ${e.message}`);
//       return "I'm sorry, I encountered an error. Please try again.";
//     }
//   }, [conversation, passedAvatarName, log]);

//   const handleSendQuestion = useCallback(async (question: string) => {
//     if (!question.trim() || !isAvatarActive || isProcessing) return;
//     if (isPlaying) { try { await avatarRef.current?.interrupt(); } catch (_) {} }
//     setConversation(p => [...p, { type: 'user', text: question.trim() }]);
//     setUserInput(''); setIsProcessing(true);
//     try {
//       const reply = await getAIResponse(question.trim());
//       setConversation(p => [...p, { type: 'assistant', text: reply }]);
//       await handleSpeak(reply);
//     } catch (_) {
//       const err = "I'm sorry, something went wrong.";
//       setConversation(p => [...p, { type: 'assistant', text: err }]);
//       await handleSpeak(err);
//     } finally {
//       setIsProcessing(false);
//     }
//   }, [isAvatarActive, isProcessing, isPlaying, getAIResponse, handleSpeak]);

//   useEffect(() => {
//     const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SR) return;
//     recognitionRef.current = new SR();
//     recognitionRef.current.continuous = false;
//     recognitionRef.current.interimResults = false;
//     recognitionRef.current.lang = 'en-US';
//     recognitionRef.current.onresult = (e: SpeechRecognitionEvent) => {
//       const t = e.results[0][0].transcript;
//       setUserInput(t); setIsListening(false);
//       handleSendQuestion(t);
//     };
//     recognitionRef.current.onerror = () => setIsListening(false);
//     recognitionRef.current.onend   = () => setIsListening(false);
//   }, [handleSendQuestion]);

//   useEffect(() => {
//     if (isAvatarActive) {
//       timerRef.current = setInterval(() => setSessionDuration(s => s + 1), 1000);
//     } else {
//       if (timerRef.current) clearInterval(timerRef.current);
//       setSessionDuration(0);
//     }
//     return () => { if (timerRef.current) clearInterval(timerRef.current); };
//   }, [isAvatarActive]);

//   useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation]);

//   useEffect(() => { return () => { endSession(); }; }, []); // eslint-disable-line

//   // ── Chroma-key: remove green screen from HeyGen video stream ──────────────
//   // Runs a requestAnimationFrame loop that reads each video frame onto a hidden
//   // canvas, replaces green pixels with transparent, then draws to the visible canvas.
//   useEffect(() => {
//     if (!hasVideo) {
//       if (chromaRafRef.current) cancelAnimationFrame(chromaRafRef.current);
//       return;
//     }
//     const video  = videoRef.current;
//     const canvas = canvasRef.current;
//     if (!video || !canvas) return;

//     const ctx = canvas.getContext('2d', { willReadFrequently: true });
//     if (!ctx) return;

//     const processFrame = () => {
//       if (video.readyState < 2) { chromaRafRef.current = requestAnimationFrame(processFrame); return; }
//       const vw = video.videoWidth  || 640;
//       const vh = video.videoHeight || 480;
//       // Crop to a centered square so the avatar fills the circle properly
//       const size = Math.min(vw, vh);
//       const sx   = (vw - size) / 2;
//       const sy   = 0; // anchor to top so head is visible, not waist
//       canvas.width  = size;
//       canvas.height = size;
//       ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

//       const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
//       const d = frame.data;
//       for (let i = 0; i < d.length; i += 4) {
//         const r = d[i], g = d[i + 1], b = d[i + 2];
//         // Green screen: green channel significantly higher than red and blue
//         if (g > 80 && g > r * 1.3 && g > b * 1.3) {
//           d[i + 3] = 0; // transparent
//         }
//       }
//       ctx.putImageData(frame, 0, 0);
//       chromaRafRef.current = requestAnimationFrame(processFrame);
//     };

//     chromaRafRef.current = requestAnimationFrame(processFrame);
//     return () => { if (chromaRafRef.current) cancelAnimationFrame(chromaRafRef.current); };
//   }, [hasVideo]);

//   useEffect(() => {
//     if (isAvatarActive && scriptToSpeak && !hasSpokenInit.current) {
//       hasSpokenInit.current = true;
//       setConversation([{ type: 'assistant', text: scriptToSpeak }]);
//       setTimeout(() => handleSpeak(scriptToSpeak), 600);
//     }
//   }, [isAvatarActive, scriptToSpeak, handleSpeak]);

//   useEffect(() => () => {
//     if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.srcObject = null; }
//   }, []);

//   const startListening = () => {
//     if (!recognitionRef.current || isListening || isProcessing || !isAvatarActive) return;
//     if (isPlaying) avatarRef.current?.interrupt().catch(() => {});
//     setIsListening(true);
//     recognitionRef.current.start();
//   };

//   const handleBack      = useCallback(() => { endSession(); navigate(-1); }, [navigate, endSession]);
//   const handleClearChat = useCallback(async () => {
//     if (!isAvatarActive) return;
//     try { await avatarRef.current?.interrupt(); } catch (_) {}
//     setIsPlaying(false); setIsPaused(false); setCaption(''); setShowCaption(false); setConversation([]);
//   }, [isAvatarActive]);
//   const handlePause = useCallback(async () => {
//     if (!isPlaying) return;
//     try { await avatarRef.current?.interrupt(); } catch (_) {}
//     setIsPaused(true); setIsPlaying(false);
//   }, [isPlaying]);
//   const handlePlay = useCallback(async () => {
//     if (!isAvatarActive || isPlaying) return;
//     await handleSpeak(caption || scriptToSpeak);
//   }, [isAvatarActive, isPlaying, caption, scriptToSpeak, handleSpeak]);
//   const handleStop = useCallback(async () => {
//     try { await avatarRef.current?.interrupt(); } catch (_) {}
//     setIsPlaying(false); setIsPaused(false); setCaption(''); setShowCaption(false);
//   }, []);

//   const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

//   return (
//     <div className="w-full h-screen flex flex-col bg-[#F9FAFB] overflow-hidden">

//       {/* ── Header ── */}
//       <div className="px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between flex-shrink-0 border-b border-gray-200 bg-white">
//         <button onClick={handleBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
//           <FaArrowLeft size={16} /><span className="text-sm font-medium">Back</span>
//         </button>

//         <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
//           <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
//             {passedAvatarImg ? (
//               <img src={passedAvatarImg} alt={passedAvatarName}
//                 className="w-6 h-6 rounded-full object-cover object-top border border-indigo-200" />
//             ) : (
//               <div className="w-6 h-6 rounded-full bg-indigo-300 flex items-center justify-center text-white text-xs font-bold">
//                 {passedAvatarName[0]?.toUpperCase()}
//               </div>
//             )}
//             <span className="text-xs font-medium text-indigo-700">{passedAvatarName}</span>
//             {resolvedAvatarId && (
//               <span className="text-xs text-indigo-400 font-mono hidden lg:block">({resolvedAvatarId})</span>
//             )}
//           </div>

//           {isAvatarActive && (
//             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
//               <span className="text-xs font-medium text-gray-600">⏱️ {fmt(sessionDuration)}</span>
//             </div>
//           )}

//           {isAvatarActive ? (
//             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
//               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//               <span className="text-xs font-medium text-green-700">Live · Credits running</span>
//             </div>
//           ) : (
//             <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
//               <div className="w-2 h-2 bg-gray-400 rounded-full" />
//               <span className="text-xs font-medium text-gray-500">Inactive · No credits used</span>
//             </div>
//           )}

//           {audioBlocked && (
//             <button onClick={handleUnmuteAudio}
//               className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium animate-pulse">
//               🔇 Tap to Unmute
//             </button>
//           )}

//           <button onClick={() => setShowChat(v => !v)}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-2 transition-colors text-xs sm:text-sm font-medium">
//             💬 {showChat ? 'Hide' : 'Show'} Chat
//           </button>

//           {isAvatarActive && <>
//             <button onClick={handleClearChat}
//               className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-2 transition-colors">
//               <IoClose className="text-sm sm:text-base" />
//               <span className="text-xs sm:text-sm font-medium">Clear</span>
//             </button>
//             <button onClick={endSession}
//               className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-2 transition-colors text-xs sm:text-sm font-medium">
//               ⏹ End Session
//             </button>
//           </>}
//         </div>
//       </div>

//       {/* ── Main ── */}
//       <div className="flex-1 flex overflow-hidden">

//         {/* Avatar panel */}
//         <div className={`${showChat ? 'w-1/2' : 'w-full'} flex items-center justify-center px-4 py-4 sm:py-6 transition-all duration-300`}>
//           <div className="w-full max-w-2xl flex flex-col items-center justify-center gap-5">

//             {/* Avatar circle — canvas for chroma-keyed video, same circle UI as original */}
//             <div className="relative">
//               {isPlaying && <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-25 pointer-events-none" />}

//               <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-full overflow-hidden shadow-2xl border-4 border-white relative" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}>
//                 {/* Canvas shows chroma-keyed output — green pixels removed */}
//                 <canvas
//                   ref={canvasRef}
//                   className="w-full h-full object-cover"
//                   style={{ display: hasVideo ? 'block' : 'none' }}
//                 />
//                 {/* Hidden video feeds frames to the canvas chroma-key loop */}
//                 <video
//                   ref={videoRef}
//                   autoPlay playsInline muted
//                   className="absolute opacity-0 pointer-events-none w-px h-px"
//                 />

//                 {!hasVideo && (
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     {isLoadingSession ? (
//                       <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex flex-col items-center justify-center gap-3 px-4 text-center">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
//                         <p className="text-white text-sm font-medium">Connecting…</p>
//                         <p className="text-purple-200 text-xs">Resolving avatar for {passedAvatarName}…</p>
//                       </div>
//                     ) : (
//                       <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col items-center justify-center gap-4 px-6 text-center">
//                         {passedAvatarImg ? (
//                           <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-500 shadow-xl mb-1">
//                             <img src={passedAvatarImg} alt={passedAvatarName}
//                               className="w-full h-full object-cover object-top" />
//                           </div>
//                         ) : (
//                           <div className="w-24 h-24 rounded-full border-4 border-slate-500 bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold mb-1">
//                             {passedAvatarName[0]?.toUpperCase()}
//                           </div>
//                         )}
//                         <div>
//                           <p className="text-white font-semibold text-sm">{passedAvatarName}</p>
//                           <p className="text-slate-400 text-xs mt-1">Click Start Session to activate</p>
//                         </div>

//                         {scriptToSpeak && (
//                           <div className="bg-slate-800/80 border border-slate-600 rounded-lg px-3 py-2 max-w-full">
//                             <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
//                               💬 "{scriptToSpeak}"
//                             </p>
//                           </div>
//                         )}

//                         <button
//                           onClick={startSession}
//                           className="mt-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
//                         >
//                           <span>▶</span> Start Session
//                         </button>
//                         <p className="text-slate-500 text-xs">Credits charged once started</p>
//                       </div>
//                     )}
//                   </div>
//                 )}

//               </div>

//               {isPlaying    && <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">🎤 Speaking</div>}
//               {isListening  && <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">🎙️ Listening</div>}
//               {isProcessing && <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">⚡ Thinking</div>}
//             </div>

//             {/* Caption */}
//             {showCaption && caption && !showChat && (
//               <div className="w-full max-w-xl">
//                 <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 relative">
//                   <button onClick={() => setShowCaption(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
//                     <IoClose />
//                   </button>
//                   <p className="text-gray-700 text-sm leading-relaxed pr-6 italic">"{caption}"</p>
//                 </div>
//               </div>
//             )}

//             {/* Playback controls */}
//             {isAvatarActive && (
//               <div className="flex gap-3">
//                 <button onClick={handlePause} disabled={!isPlaying}
//                   className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow text-sm font-medium transition-colors">
//                   <IoPause /> Pause
//                 </button>
//                 <button onClick={handlePlay} disabled={isPlaying}
//                   className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow text-sm font-medium transition-colors">
//                   <IoPlay /> {isPaused ? 'Resume' : 'Play'}
//                 </button>
//                 <button onClick={handleStop}
//                   className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow text-sm font-medium transition-colors">
//                   <IoStop /> Stop
//                 </button>
//               </div>
//             )}

//             {/* Debug panel */}
//             <div className="w-full max-w-xl">
//               <details className="bg-gray-900 rounded-xl overflow-hidden">
//                 <summary className="px-4 py-2 text-xs text-green-400 font-mono cursor-pointer hover:bg-gray-800 select-none">
//                   🔍 Avatar Debug Log ({debugLines.length}) — expand to diagnose avatar issue
//                 </summary>
//                 <div className="px-4 pb-3 max-h-52 overflow-y-auto">
//                   {debugLines.length === 0 ? (
//                     <p className="text-gray-500 text-xs font-mono py-2">
//                       Start a session — this will show which avatar IDs your account has access to.
//                     </p>
//                   ) : (
//                     debugLines.map((line, i) => (
//                       <p key={i} className={`text-xs font-mono py-0.5 border-b border-gray-800 ${
//                         line.includes('✅') ? 'text-green-400' :
//                         line.includes('❌') ? 'text-red-400' :
//                         line.includes('⚠️') ? 'text-yellow-400' :
//                         line.includes('•') ? 'text-cyan-300' :
//                         'text-gray-400'
//                       }`}>{line}</p>
//                     ))
//                   )}
//                 </div>
//               </details>
//               <p className="text-xs text-gray-400 text-center mt-1">
//                 ↑ Expand after starting session to see which avatars your plan supports
//               </p>
//             </div>

//             {!isAvatarActive && !isLoadingSession && (
//               <p className="text-gray-400 text-xs text-center max-w-xs">
//                 Click <strong className="text-gray-600">Start Session</strong> to activate <strong className="text-gray-600">{passedAvatarName}</strong>.
//               </p>
//             )}
//           </div>
//         </div>

//         {/* ── Chat panel ── */}
//         {showChat && (
//           <div className="w-1/2 border-l border-gray-200 flex flex-col bg-white">
//             <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
//               <div className="flex items-center gap-3">
//                 {passedAvatarImg ? (
//                   <img src={passedAvatarImg} alt={passedAvatarName}
//                     className="w-8 h-8 rounded-full object-cover object-top border-2 border-indigo-200 flex-shrink-0" />
//                 ) : (
//                   <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
//                     {passedAvatarName[0]?.toUpperCase()}
//                   </div>
//                 )}
//                 <div>
//                   <h3 className="text-base font-semibold text-gray-800">Conversation with {passedAvatarName}</h3>
//                   <p className="text-xs text-gray-500 mt-0.5">
//                     {isAvatarActive ? 'Type or speak your question' : 'Start the session to begin chatting'}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 space-y-3">
//               {conversation.length === 0 ? (
//                 <div className="flex items-center justify-center h-full text-center text-gray-400">
//                   <div>
//                     <div className="text-5xl mb-3">💬</div>
//                     <p className="text-sm font-medium">No messages yet</p>
//                     <p className="text-xs mt-1">{isAvatarActive ? 'Type below or tap the microphone' : 'Start the session first'}</p>
//                   </div>
//                 </div>
//               ) : (
//                 <>
//                   {conversation.map((msg, i) => (
//                     <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
//                       {msg.type === 'assistant' && (
//                         passedAvatarImg ? (
//                           <img src={passedAvatarImg} alt={passedAvatarName}
//                             className="w-7 h-7 rounded-full object-cover object-top border border-gray-200 flex-shrink-0 mr-2 self-end" />
//                         ) : (
//                           <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2 self-end">
//                             {passedAvatarName[0]?.toUpperCase()}
//                           </div>
//                         )
//                       )}
//                       <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.type === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
//                         <div className="text-xs font-semibold mb-1 opacity-60">
//                           {msg.type === 'user' ? '👤 You' : `🤖 ${passedAvatarName}`}
//                         </div>
//                         <div className="text-sm leading-relaxed">{msg.text}</div>
//                       </div>
//                     </div>
//                   ))}
//                   <div ref={chatEndRef} />
//                 </>
//               )}
//             </div>

//             <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
//               {!isAvatarActive ? (
//                 <div className="flex flex-col items-center gap-3 py-4">
//                   <p className="text-sm text-gray-500">{passedAvatarName} is not active</p>
//                   <button onClick={startSession} disabled={isLoadingSession}
//                     className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
//                     {isLoadingSession
//                       ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Connecting…</>
//                       : <><span>▶</span> Start Session</>}
//                   </button>
//                 </div>
//               ) : (
//                 <div className="flex gap-2">
//                   <input
//                     type="text" value={userInput}
//                     onChange={e => setUserInput(e.target.value)}
//                     onKeyDown={e => {
//                       if (e.key === 'Enter' && !e.shiftKey && !isProcessing && userInput.trim()) {
//                         e.preventDefault(); handleSendQuestion(userInput);
//                       }
//                     }}
//                     placeholder={`Ask ${passedAvatarName} anything…`}
//                     className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-gray-100"
//                     disabled={isProcessing || isListening}
//                   />
//                   <button
//                     onClick={() => handleSendQuestion(userInput)}
//                     disabled={isProcessing || !userInput.trim() || isListening}
//                     className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
//                   >
//                     <FaPaperPlane size={14} />
//                   </button>
//                   <button
//                     onClick={startListening}
//                     disabled={isProcessing || isListening}
//                     className={`${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
//                   >
//                     <FaMicrophone size={14} />
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AiAssist;