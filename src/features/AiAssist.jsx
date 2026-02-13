import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBackCircle, IoClose, IoPause, IoPlay, IoStop } from "react-icons/io5";
import { FaArrowLeft, FaMicrophone, FaPaperPlane } from "react-icons/fa";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from '@heygen/streaming-avatar';

const AiAssist = () => {
  const navigate = useNavigate();
  const location = useLocation();   //   this is an object containing information about this page
  
  // Get script from navigation state
  const scriptFromChat = location.state?.script || 'Hello! I am Astra, your Ping Federate assistant. How can I help you today?';
  const chatHistory = location.state?.chatHistory || {};

  // HeyGen states
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isAvatarActive, setIsAvatarActive] = useState(false);  //false = Not active (avatar not loaded)  true = Active (avatar is ready)
  const [stream, setStream] = useState(null); //null = No video yet  MediaStream object = Video is streaming  The video data is sent from a server to your device continuously while you are watching it.
  const [isPlaying, setIsPlaying] = useState(false);  //false = Silent  true = Speaking right now  kind of video already stored locally
  const [isPaused, setIsPaused] = useState(false); // false = Not paused  true = Paused
  const [caption, setCaption] = useState(''); // What it means: The text currently being spoken (subtitle)
  const [showCaption, setShowCaption] = useState(true);
  const [debug, setDebug] = useState(''); // Debug message for developers



  // Advanced features states
  const [conversation, setConversation] = useState([]);  // [{type: 'user', text: 'Hi'}, {type: 'assistant', text: 'Hello'}] = Chat history
  const [userInput, setUserInput] = useState('');  // '' = Empty input box  'Hello world' = Caption text
  const [isListening, setIsListening] = useState(false);  //false = Not listening   true = Listening to your voice
  const [isProcessing, setIsProcessing] = useState(false);  // false = Not processing  true = Generating response
  const [sessionDuration, setSessionDuration] = useState(0); // 0 = Just    started  125 = 125 seconds (2 minutes 5 seconds)
  const [showChat, setShowChat] = useState(false); // false = Hidden      true = Showing on screen

  const avatar = useRef(null);
  const videoRef = useRef(null);  //Needed to control the video (play, pause, set source)
  const hasSpokenInitialScript = useRef(false);  // What it means: Has the avatar said the welcome message?     A checkbox: "Did I say hello already?"
  const mediaStreamRef = useRef(null);  // Needed to stop the stream when session ends What it means: Storage for the media stream (video/audio)
  const recognitionRef = useRef(null);  //Handles converting your voice to text  What it means: Storage for speech recognition object
  const sessionTimerRef = useRef(null); // Used to count seconds (0, 1, 2, 3...)  What it means: Storage for the timer interval
  const chatEndRef = useRef(null); // Used to auto-scroll to latest message  What it means: Reference to the bottom of the chat

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {  //webkitSpeechRecogination in window  means we are checking if the browser supports the  speech recogination 
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; 
      recognitionRef.current = new SpeechRecognition();  // storing the speachReconigtion object instance in  current of the ref  browser provided object which can start listining ,  stop listining , detect speech  convert speech to text 
      recognitionRef.current.continuous = false;  // continuous = false = Stop listening after one phrase   continuous = true would keep listening forever until u stop
      recognitionRef.current.interimResults = false; // interimResults = false = Only give final result  interimResults = true = Give partial results as you
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {  // onresult is an predefined method speechRecognition 
        const transcript = event.results[0][0].transcript; //event.results = Array of all results [0] = First result (most recent) [0] = First alternative (best guess)  .transcript = The actual text
        setUserInput(transcript); //transcript is the  Put the recognized text into the input box  User will see what they said
        setIsListening(false); // Turn off the "listening" indicator  Show that we're done listening
        handleSendQuestion(transcript); 
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setDebug('Voice recognition failed');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Session timer
  // we creating this useRef to create an  interval Id and that interval id is used to kill the sessionDuration state
  useEffect(() => {
    if (isAvatarActive) {
      sessionTimerRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) {    // truthy and falsy thing 
        clearInterval(sessionTimerRef.current);
      }
      setSessionDuration(0);   
    }

    // unmounting of the component 
    return () => { 
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isAvatarActive]);   // this whole useeffect works based on the value of the isAvatarActive thing 

  // Auto-scroll chat
  // scrollIntoView is an build in DOM method 
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Automatically start avatar session when component mounts
  useEffect(() => {
    startSession();
    
    // Cleanup on unmount
    return () => {
      if (avatar.current) {
        avatar.current.stopAvatar().catch(console.error);
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speak the script once avatar is ready initial script speeking  
  // first the avatar , script needs to be present and the initialscript has not to be speeken 
  useEffect(() => {
    if (isAvatarActive && scriptFromChat && !hasSpokenInitialScript.current) {
      hasSpokenInitialScript.current = true;
      
      // after 0.5 second the avatar speeks 
      setTimeout(() => {
        handleSpeak(scriptFromChat);  // this is responsible for the initial speech 
        // Add initial greeting to conversation
        setConversation([{ type: 'assistant', text: scriptFromChat }]);  // this is a state keeping recods of the communication 
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvatarActive]);

  // Handle video stream when it's set
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('Setting video stream:', stream);
      videoRef.current.srcObject = stream;
      mediaStreamRef.current = stream;
      
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }
  }, [stream]);

  // Fetch HeyGen access token
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
      return data.data.token;   // here the one data is the variable and other data is coming from the response from the  api 
      
    } catch (error) {
      console.error('Error fetching access token:', error);
      throw error;
    }
  };

  // Get AI response with conversation history
  const getAIResponse = async (question) => {
    try {
      // Build conversation history for context (last 6 messages)
      const messages = conversation.slice(-6).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Add current question
      messages.push({
        role: 'user',
        content: question
      });

      const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

      if (!ANTHROPIC_API_KEY) {
        throw new Error('VITE_ANTHROPIC_API_KEY not found in .env file');
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: messages,
          system: 'You are Astra, a helpful Ping Federate assistant. Keep responses conversational and concise (2-3 sentences max) as they will be spoken through an avatar. You can reference previous parts of the conversation.'
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return "I'm sorry, I encountered an error processing your question. Please try again.";
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
        setDebug('Stream connected');
      });

      console.log('🎭 Starting avatar session...');

      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.High,
        voice: {
          rate: 1.0,
          emotion: VoiceEmotion.FRIENDLY,
        },
        language: 'en',
        disableIdleTimeout: false,
      });

      console.log('✅ Avatar session started:', res);
      setIsAvatarActive(true);
      setDebug('Avatar ready');
      
    } catch (error) {
      console.error('❌ Error starting avatar session:', error);
      setDebug(`Error: ${error.message}`);
      
      let errorMessage = 'Failed to start avatar session. ';
      
      if (error.message.includes('400')) {
        errorMessage += 'Configuration error. Please check your avatar settings or use default avatar.';
      } else if (error.message.includes('API key')) {
        errorMessage += 'Invalid API key. Please check your .env file.';
      } else if (error.message.includes('401')) {
        errorMessage += 'Authentication failed. Your API key may be invalid or expired.';
      } else if (error.message.includes('403')) {
        errorMessage += 'Access forbidden. Your account may not have permission for streaming avatars.';
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
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setStream(null);
      setIsAvatarActive(false);
      setIsPlaying(false);
      setIsPaused(false);
      setCaption('');
      setDebug('Avatar session ended');
      hasSpokenInitialScript.current = false;
    } catch (error) {
      console.error('Error ending avatar session:', error);
      setDebug(`Error ending session: ${error.message}`);
    }
  };

  // Make avatar speak
  const handleSpeak = useCallback(async (textToSpeak) => {
    if (!avatar.current || !isAvatarActive) {
      console.error('Avatar not initialized');
      setDebug('Avatar not initialized');
      return;
    }

    if (!textToSpeak || textToSpeak.trim() === '') {
      console.warn('Empty text provided');
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
      console.log('✅ Speaking command sent');
      setDebug('Speaking...');
    } catch (error) {
      console.error('Error making avatar speak:', error);
      setDebug(`Error: ${error.message}`);
    }
  }, [isAvatarActive]);

  // Handle sending a question
  const handleSendQuestion = async (question) => {
    if (!question || !question.trim() || !isAvatarActive || isProcessing) return;

    const trimmedQuestion = question.trim();

    // Interrupt if avatar is speaking
    if (isPlaying) {
      try {
        await avatar.current.interrupt();
      } catch (error) {
        console.error('Error interrupting:', error);
      }
    }

    // Add user message to conversation
    setConversation(prev => [...prev, { type: 'user', text: trimmedQuestion }]);
    setUserInput('');
    setIsProcessing(true);
    setDebug('Processing question...');

    try {
      // Get AI response
      const aiResponse = await getAIResponse(trimmedQuestion);
      
      // Add AI response to conversation
      setConversation(prev => [...prev, { type: 'assistant', text: aiResponse }]);
      
      // Make avatar speak the response
      await handleSpeak(aiResponse);
      
      setDebug('Response delivered');
    } catch (error) {
      console.error('Error handling question:', error);
      setDebug('Error processing question');
      
      const errorMsg = "I'm sorry, I encountered an error. Please try again.";
      setConversation(prev => [...prev, { type: 'assistant', text: errorMsg }]);
      await handleSpeak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start voice input
  const startListening = () => {
    if (recognitionRef.current && !isListening && !isProcessing) {
      // Interrupt avatar if speaking
      if (isPlaying) {
        avatar.current?.interrupt().catch(console.error);
      }
      setIsListening(true);
      setDebug('Listening...');
      recognitionRef.current.start();
    }
  };

  const handleBack = useCallback(() => {
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
        setShowCaption(false);
        setConversation([]);
        setDebug('Cleared');
      } catch (error) {
        console.error('Error clearing:', error);
      }
    }
  }, [isAvatarActive]);

  const handlePause = useCallback(async () => {
    if (!avatar.current || !isPlaying) {
      console.log('Cannot pause - avatar not playing');
      return;
    }
    
    try {
      await avatar.current.interrupt();
      setIsPaused(true);
      setIsPlaying(false);
      setDebug('Paused');
    } catch (error) {
      console.error('Error pausing avatar:', error);
      setDebug(`Error pausing: ${error.message}`);
    }
  }, [isPlaying]);

  const handlePlay = useCallback(async () => {
    if (!avatar.current || !isAvatarActive) {
      alert('Avatar is not initialized. Please wait for the avatar to load.');
      return;
    }
    
    try {
      if (!isPlaying && scriptFromChat) {
        await handleSpeak(scriptFromChat);
      }
    } catch (error) {
      console.error('Error in handlePlay:', error);
      setDebug(`Error: ${error.message}`);
    }
  }, [isPaused, isPlaying, scriptFromChat, isAvatarActive, handleSpeak]);

  const handleStop = useCallback(async () => {
    if (!avatar.current) {
      return;
    }
    
    try {
      await avatar.current.interrupt();
      setIsPlaying(false);
      setIsPaused(false);
      setCaption('');
      setShowCaption(false);
      setDebug('Stopped');
    } catch (error) {
      console.error('Error stopping avatar:', error);
      setDebug(`Error stopping: ${error.message}`);
    }
  }, []);

  const handleCloseCaption = useCallback(() => {
    setShowCaption(false);
  }, []);

  const handleRestartSession = useCallback(() => {
    if (isAvatarActive) {
      endSession().then(() => {
        setTimeout(() => startSession(), 1000);
      });
    } else {
      startSession();
    }
  }, [isAvatarActive]);

  // Format session duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#F9FAFB] overflow-hidden">
      {/* Header - Fixed height */}
      <div className="px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBack()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <FaArrowLeft size={16} />
            <span className="text-sm">Back</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Session Timer */}
          {isAvatarActive && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-xs font-medium text-gray-600">⏱️ {formatDuration(sessionDuration)}</span>
            </div>
          )}

          {/* Session Status Indicator */}
          {isAvatarActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">Live</span>
            </div>
          )}

          {/* Toggle Chat Button */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-2 transition-colors text-xs sm:text-sm font-medium"
          >
            💬 {showChat ? 'Hide' : 'Show'} Chat
          </button>
          
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Avatar */}
        <div className={`${showChat ? 'w-1/2' : 'w-full'} flex items-center justify-center px-4 py-4 sm:py-6 transition-all duration-300`}>
          <div className="w-full max-w-2xl flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5">
            
            {/* Avatar Container */}
            <div className="flex justify-center flex-shrink-0">
              <div className="relative">
                {!stream ? (
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
                  <div className="w-35 h-35 xs:w-48 xs:h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-full overflow-hidden shadow-2xl border-2 sm:border-4 border-white bg-gray-900">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      onLoadedMetadata={(e) => {
                        console.log('Video metadata loaded');
                        e.target.play().catch(err => console.error('Play error:', err));
                      }}
                      onError={(e) => {
                        console.error('Video error:', e);
                      }}
                    />
                  </div>
                )}

                {/* Status Indicators on Avatar */}
                {isPlaying && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    🎤 Speaking
                  </div>
                )}
                {isListening && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                    🎙️ Listening
                  </div>
                )}
                {isProcessing && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    ⚡ Processing
                  </div>
                )}
              </div>
            </div>

            {/* Caption Box */}
            {showCaption && caption && !showChat && (
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

            {/* Control Buttons */}
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

            {/* Debug Info */}
            {import.meta.env.DEV && debug && (
              <div className="mt-2 px-4 py-2 bg-gray-800 text-white text-xs rounded-lg max-w-lg text-center">
                {debug}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat Interface */}
        {showChat && (
          <div className="w-1/2 border-l border-gray-200 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Conversation</h3>
              <p className="text-xs text-gray-600 mt-1">Ask questions and get AI-powered responses</p>
            </div>

            {/* Conversation History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversation.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="text-gray-400">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-sm">Start a conversation</p>
                    <p className="text-xs mt-1">Type a message or use voice input</p>
                  </div>
                </div>
              ) : (
                <>
                  {conversation.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
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

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleSendQuestion(userInput)}
                  placeholder="Type your question..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isProcessing || isListening || !isAvatarActive}
                />
                <button
                  onClick={() => handleSendQuestion(userInput)}
                  disabled={isProcessing || !userInput.trim() || isListening || !isAvatarActive}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane />
                </button>
                <button
                  onClick={startListening}
                  disabled={isProcessing || isListening || !isAvatarActive}
                  className={`${
                    isListening ? 'bg-red-600 animate-pulse' : 'bg-green-600 hover:bg-green-700'
                  } text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FaMicrophone />
                </button>
              </div>
              {!isAvatarActive && (
                <p className="text-xs text-red-600 mt-2">Avatar not active. Please wait for initialization.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssist;