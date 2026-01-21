import React, { useState, useCallback, useRef, useEffect } from 'react';
import { IoArrowBackCircle, IoClose, IoSend, IoMicOutline, IoAttachOutline } from "react-icons/io5";
import { useNavigate , useLocation } from 'react-router-dom';
import { HiSparkles } from "react-icons/hi2";
import {Typewriter} from "react-simple-typewriter" ;    

const AgentChat = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const { agentName, agentRole, agentImage } = location.state || {
  agentName: "Astra",
  agentRole: "Ping Federate Agent",
  agentImage: "/avatar.png"
};


  // Chat history in the required format: { 'User1': <message>, 'Agent1': <message>, ... }
  const [chatHistory, setChatHistory] = useState({});

  // HeyGen state - to be passed to AI Assist page
  const [heygenScript, setHeygenScript] = useState('');

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Simple AI response generator (frontend only)
  const generateAIResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple keyword-based responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm Astra, your Ping Federate assistant. I can help you with authentication, OAuth, SAML, and more. What would you like to know?";
    } else if (lowerMessage.includes('oauth')) {
      return "Ping Federate provides comprehensive OAuth 2.0 support. You can configure authorization servers, manage clients, and set up various grant types including authorization code, client credentials, and PKCE.";
    } else if (lowerMessage.includes('saml')) {
      return "SAML 2.0 integration in Ping Federate allows you to set up identity provider and service provider connections. You can configure assertions, bindings, and metadata exchange.";
    } else if (lowerMessage.includes('help')) {
      return "I can assist you with Ping Federate configuration, troubleshooting, OAuth flows, SAML setup, user authentication, and federation best practices. What specific topic would you like help with?";
    } else if (lowerMessage.includes('configure') || lowerMessage.includes('setup')) {
      return "To configure Ping Federate, you'll need to access the admin console, set up your connections, define authentication policies, and configure adapters. Would you like detailed steps for a specific component?";
    } else {
      return `You asked about "${userMessage}". As Astra, your Ping Federate assistant, I'm here to help with authentication, federation, OAuth, SAML, and identity management. Could you provide more details about what you need?`;
    }
  };

  // Handle send message
  const handleSend = useCallback(async () => {
    if (inputValue.trim()) {
      const userMessageIndex = Object.keys(chatHistory).filter(k => k.startsWith('User')).length + 1;
      const userKey = `User${userMessageIndex}`;
      
      const userMessage = {
        id: Date.now(),
        text: inputValue,
        sender: 'user',
        timestamp: new Date()
      };
      
      // Update messages array for display
      setMessages(prev => [...prev, userMessage]);
      
      // Update chat history with new user message
      const updatedHistory = {
        ...chatHistory,
        [userKey]: inputValue
      };
      setChatHistory(updatedHistory);
      
      const currentInput = inputValue;
      setInputValue('');
      setIsTyping(true);

      // Simulate typing delay
      setTimeout(() => {
        setIsTyping(false);
        
        // Generate AI response
        const aiResponseText = generateAIResponse(currentInput);
        
        const agentMessageIndex = Object.keys(updatedHistory).filter(k => k.startsWith('Agent')).length + 1;
        const agentKey = `Agent${agentMessageIndex}`;
        
        const aiMessage = {
          id: Date.now() + 1,
          text: aiResponseText,
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Update chat history with agent response
        const newHistory = {
          ...updatedHistory,
          [agentKey]: aiResponseText
        };
        setChatHistory(newHistory);
        
        // Store the script for HeyGen
        setHeygenScript(aiResponseText);
        
        console.log('HeyGen Script:', aiResponseText);
        console.log('Chat History:', newHistory);
      }, 1000);
    }
  }, [inputValue, chatHistory]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setInputValue('');
    setChatHistory({});
    setHeygenScript('');
  }, []);

  const handleBack = useCallback(() => {
    navigate('/agents');
  }, [navigate]);

  const handleExecute = useCallback(() => {
    navigate('/agents/agentchat/execute');
  }, [navigate]);

  const handleAIAssistance = useCallback(() => {
    // Navigate to AI Assist page with the latest script
    navigate('/agents/agentchat/aiassist', { 
      state: { 
        script: heygenScript,
        chatHistory: chatHistory 
      } 
    });
  }, [navigate, heygenScript, chatHistory]);

  return (
    <div className="w-full  bg-[#F3F4F6]">
      {/* Header */}
      <div className="px-10 py-5 flex items-center justify-between">
        {/* Left side - Back button and title */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="text-gray-800 hover:text-gray-600 transition-colors"
            aria-label="Go back"
          >
            <IoArrowBackCircle className="text-3xl" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">AI Agents</h1>
        </div>

        {/* Right side - Clear chat button */}
        <button
          onClick={handleClearChat}
          className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
          aria-label="Clear chat"
        >
          <IoClose className="text-lg" />
          <span className="text-sm font-medium">Clear chat</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex justify-center   px-4">
        <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg relative">
          
          {/* Avatar */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-30 h-30 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
              <img 
                src="/avatar.png" 
                alt="Astra"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjOTMzM0VBIi8+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNTAiIHI9IjI0IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMzIgMTEyQzMyIDk1LjQzMTUgNDUuNDMxNSA4MiA2MiA4Mkg2NkM4Mi41Njg1IDgyIDk2IDk1LjQzMTUgOTYgMTEyVjEyOEgzMlYxMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                }}
              />
            </div>
          </div>

          {/* Content area */}
          <div className="pt-1 pb-6 px-6">
            
            {/* Agent info */}
            <div className="flex flex-col items-center text-center space-y-2 pt-8">
              {/* Name badge */}
              <div className="bg-blue-100 text-blue-700 px-4 rounded-full text-sm font-medium z-11">
                  {agentName}
              </div>
              
              {/* Role */}
              <p className="text-sm text-gray-600">Ping Federate Agent</p>
              
              {/* Welcome message */}
              <h2 className="text-2xl font-bold text-gray-900 ">
                <Typewriter
                 words ={["How May I Help You ?"]}
                 cursor
                 cursorStyle="|"
                 typeSpeed={70}
                 deleteSpeed={30}
                 delaySpeed={1200}

                />
              </h2>
            </div>

            {/* Messages container */}
            <div className=" h-[250px] overflow-y-auto px-4 pt-10">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400 text-sm">Start a conversation...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-3">
                {/* Attach button */}
                <button
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Attach file"
                >
                  <IoAttachOutline className="text-xl" />
                </button>

                {/* Input field */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Anything . . ."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-700 placeholder-gray-400"
                  />
                </div>

                {/* Voice button */}
                <button
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Voice input"
                >
                  <IoMicOutline className="text-xl" />
                </button>

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  aria-label="Send message"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Send</span>
                </button>

                {/* AI Assistance button */}
                <button
                  className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  aria-label="AI Assistance"
                  onClick={handleAIAssistance}
                >
                  <HiSparkles className="text-blue-600 text-lg" />
                  <span className="text-sm font-medium text-gray-700">AI Assistance</span>
                </button>

                {/* Execute button */}
                <button
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  aria-label="Execute"
                  onClick={handleExecute}
                >
                  Execute
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;