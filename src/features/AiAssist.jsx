import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBackCircle, IoClose, IoPause, IoPlay, IoStop } from "react-icons/io5";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from '@heygen/streaming-avatar';

const AiAssist = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get script from navigation state
  const scriptFromChat = location.state?.script || 'Hello! I am Astra, your Ping Federate assistant. How can I help you today?';
  const chatHistory = location.state?.chatHistory || {};

  // HeyGen states
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isAvatarActive, setIsAvatarActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [caption, setCaption] = useState('');
  const [showCaption, setShowCaption] = useState(true);
  const [debug, setDebug] = useState('');

  const avatar = useRef(null);
  const videoRef = useRef(null);

  // Automatically start avatar session when component mounts
  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speak the script once avatar is ready
  useEffect(() => {
    if (isAvatarActive && scriptFromChat && !isPlaying) {
      handleSpeak(scriptFromChat);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvatarActive]);

  // Fetch HeyGen access token - FRONTEND ONLY VERSION
  const fetchAccessToken = async () => {
    try {
      const HEYGEN_API_KEY = import.meta.env.VITE_HEYGEN_API_KEY;
      
      if (!HEYGEN_API_KEY) {
        throw new Error('VITE_HEYGEN_API_KEY not found in .env file');
      }

      console.log('🔑 Requesting HeyGen token...');

      const response = await fetch(
        'https://api.heygen.com/v1/streaming.create_token',
        {
          method: 'POST',
          headers: {
            'x-api-key': HEYGEN_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HeyGen API error:', errorText);
        throw new Error(`HeyGen API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Token received');
      return data.data.token;
      
    } catch (error) {
      console.error('Error fetching access token:', error);
      throw error;
    }
  };

  // Start avatar session
  const startSession = async () => {
    setIsLoadingSession(true);
    setDebug('Initializing avatar...');
    
    try {
      const newToken = await fetchAccessToken();
      
      avatar.current = new StreamingAvatar({
        token: newToken,
      });

      // Set up event listeners
      avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log('Avatar started talking', e);
        setIsPlaying(true);
        setIsPaused(false);
        setDebug('Avatar speaking...');
      });

      avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log('Avatar stopped talking', e);
        setIsPlaying(false);
        setDebug('Avatar ready');
      });

      avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('Stream disconnected');
        setDebug('Stream disconnected');
        endSession();
      });

      avatar.current.on(StreamingEvents.STREAM_READY, (event) => {
        console.log('Stream ready:', event.detail);
        setStream(event.detail);
        
        if (videoRef.current) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setDebug('Avatar ready');
          };
        }
      });

      console.log('🎭 Starting avatar session...');

      // Start avatar with configuration
      // NOTE: Remove avatarName and voice.voiceId to use account defaults
      // Or specify valid IDs from your HeyGen account
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.High,
        // avatarName: 'Angela-inblackskirt-20220820', // Use a valid avatar ID from your account
        // OR omit avatarName to use your account's default avatar
        voice: {
          rate: 1.0, // Speech rate (0.5 to 2.0)
          emotion: VoiceEmotion.FRIENDLY,
          // voiceId: '1bd001e7e50f421d891986aad5158bc8', // Optional: specify voice ID
        },
        language: 'en',
        disableIdleTimeout: false,
      });

      console.log('✅ Avatar session started:', res);
      setIsAvatarActive(true);
      setDebug('Avatar session started');
      
    } catch (error) {
      console.error('❌ Error starting avatar session:', error);
      setDebug(`Error: ${error.message}`);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to start avatar session.';
      if (error.message.includes('400')) {
        errorMessage = 'Configuration error. Please check your avatar settings or use default avatar.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'Invalid API key. Please check your .env file.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // End avatar session
  const endSession = async () => {
    if (!avatar.current) {
      setDebug('No avatar session to end');
      return;
    }

    try {
      await avatar.current.stopAvatar();
      setStream(null);
      setIsAvatarActive(false);
      setIsPlaying(false);
      setIsPaused(false);
      setCaption('');
      setDebug('Avatar session ended');
    } catch (error) {
      console.error('Error ending avatar session:', error);
      setDebug(`Error ending session: ${error.message}`);
    }
  };

  // Make avatar speak
  const handleSpeak = async (textToSpeak) => {
    if (!avatar.current || !isAvatarActive) {
      console.error('Avatar not initialized');
      setDebug('Avatar not initialized');
      return;
    }

    setCaption(textToSpeak);
    setShowCaption(true);
    setDebug('Preparing to speak...');

    try {
      await avatar.current.speak({
        text: textToSpeak,
        taskType: TaskType.REPEAT,
        taskMode: 'sync',
      });
      setDebug('Speaking...');
    } catch (error) {
      console.error('Error making avatar speak:', error);
      setDebug(`Error: ${error.message}`);
    }
  };

  const handleBack = useCallback(() => {
    // Clean up before navigating back
    if (avatar.current && isAvatarActive) {
      endSession();
    }
    navigate('/agents/agentchat');
  }, [navigate, isAvatarActive]);

  const handleClearChat = useCallback(async () => {
    if (avatar.current && isAvatarActive) {
      try {
        await avatar.current.interrupt();
        setIsPlaying(false);
        setIsPaused(false);
        setCaption('');
        setDebug('Stopped');
      } catch (error) {
        console.error('Error stopping avatar:', error);
      }
    }
  }, [isAvatarActive]);

  const handlePause = useCallback(async () => {
    if (!avatar.current || !isPlaying) return;
    
    try {
      await avatar.current.pauseAvatar();
      setIsPaused(true);
      setIsPlaying(false);
      setDebug('Paused');
    } catch (error) {
      console.error('Error pausing avatar:', error);
      setDebug(`Error pausing: ${error.message}`);
    }
  }, [isPlaying]);

  const handlePlay = useCallback(async () => {
    if (!avatar.current) return;
    
    try {
      if (isPaused) {
        // Resume if paused
        await avatar.current.resumeAvatar();
        setIsPaused(false);
        setIsPlaying(true);
        setDebug('Resumed');
      } else if (scriptFromChat) {
        // Start speaking again if not paused
        await handleSpeak(scriptFromChat);
      }
    } catch (error) {
      console.error('Error resuming avatar:', error);
      setDebug(`Error resuming: ${error.message}`);
    }
  }, [isPaused, scriptFromChat]);

  const handleStop = useCallback(async () => {
    if (!avatar.current) return;
    
    try {
      await avatar.current.interrupt();
      setIsPlaying(false);
      setIsPaused(false);
      setCaption('');
      setDebug('Stopped');
    } catch (error) {
      console.error('Error stopping avatar:', error);
      setDebug(`Error stopping: ${error.message}`);
    }
  }, []);

  const handleCloseCaption = useCallback(() => {
    setShowCaption(false);
  }, []);

  // Restart session if needed
  const handleRestartSession = useCallback(() => {
    if (isAvatarActive) {
      endSession().then(() => {
        setTimeout(() => startSession(), 500);
      });
    } else {
      startSession();
    }
  }, [isAvatarActive]);

  return (
    <div className="w-full h-screen flex flex-col bg-[#F9FAFB] overflow-hidden">
      {/* Header - Fixed height */}
      <div className="px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="text-gray-800 hover:text-gray-600 transition-colors"
            aria-label="Go back"
          >
            <IoArrowBackCircle className="text-2xl sm:text-3xl" />
          </button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">AI Agents</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Session Status Indicator */}
          {isAvatarActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">Live</span>
            </div>
          )}
          
          <button
            onClick={handleClearChat}
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-2 transition-colors"
            aria-label="Clear chat"
          >
            <IoClose className="text-sm sm:text-base md:text-lg" />
            <span className="text-xs sm:text-sm font-medium">Clear</span>
          </button>
        </div>
      </div>

      {/* Main Content - Fills remaining space, centers content vertically */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 sm:py-6 overflow-hidden">
        <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5">
          
          {/* Avatar Container */}
          <div className="flex justify-center flex-shrink-0">
            <div className="relative">
              {!stream ? (
                // Placeholder when avatar is not loaded
                <div className="w-35 h-35 xs:w-48 xs:h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-full overflow-hidden shadow-2xl border-2 sm:border-4 border-white bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  {isLoadingSession ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                      <p className="text-white text-sm font-medium">Loading Avatar...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-white text-6xl">👤</div>
                      <button
                        onClick={handleRestartSession}
                        className="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                      >
                        Start Session
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // HeyGen Video Stream
                <div className="w-35 h-35 xs:w-48 xs:h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-full overflow-hidden shadow-2xl border-2 sm:border-4 border-white bg-gray-200">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Caption Box - Responsive sizing and max height */}
          {showCaption && caption && (
            <div className="relative w-full max-w-xl lg:max-w-2xl flex-shrink-0">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 md:p-5 relative">
                <button
                  onClick={handleCloseCaption}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close caption"
                >
                  <IoClose className="text-base sm:text-lg md:text-xl" />
                </button>

                <p className="text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed pr-6 sm:pr-8">
                  "{caption}"
                </p>
              </div>
            </div>
          )}

          {/* Control Buttons - Responsive sizing */}
          <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            <button
              onClick={handlePause}
              disabled={!isPlaying || !isAvatarActive}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg flex items-center gap-1 sm:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base"
              aria-label="Pause"
            >
              <IoPause className="text-sm sm:text-base md:text-lg" />
              <span className="font-medium">Pause</span>
            </button>

            <button
              onClick={handlePlay}
              disabled={isPlaying || !isAvatarActive}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg flex items-center gap-1 sm:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base"
              aria-label="Play"
            >
              <IoPlay className="text-sm sm:text-base md:text-lg" />
              <span className="font-medium">{isPaused ? 'Resume' : 'Play'}</span>
            </button>

            <button
              onClick={handleStop}
              disabled={!isAvatarActive}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg flex items-center gap-1 sm:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base"
              aria-label="Stop"
            >
              <IoStop className="text-sm sm:text-base md:text-lg" />
              <span className="font-medium">Stop</span>
            </button>
          </div>

          {/* Debug Info (only in development) */}
          {import.meta.env.DEV && debug && (
            <div className="mt-2 px-4 py-2 bg-gray-800 text-white text-xs rounded-lg max-w-lg text-center">
              {debug}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAssist;