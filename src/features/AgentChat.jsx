import React, { useState, useCallback, useRef, useEffect } from 'react';
import { IoArrowBackCircle, IoClose, IoSend, IoMicOutline, IoAttachOutline } from "react-icons/io5";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { HiSparkles } from "react-icons/hi2";
import {Typewriter} from "react-simple-typewriter" ;    
import api from '../utils/api';
import { auth } from '../utils/auth';

const AgentChat = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const location = useLocation();
  const preloadedAgent = location.state?.agent;
  const [agent, setAgent] = useState(preloadedAgent || null);
  const [agentError, setAgentError] = useState('');
  const [loadingAgent, setLoadingAgent] = useState(!preloadedAgent);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Chat history in the required format: { 'User1': <message>, 'Agent1': <message>, ... }
  const [chatHistory, setChatHistory] = useState({});

  // HeyGen state - to be passed to AI Assist page
  const [heygenScript, setHeygenScript] = useState('');

  // File upload state
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  // Approval state
  const [pendingApproval, setPendingApproval] = useState(null);
  const [approvalProcessing, setApprovalProcessing] = useState(false);
  
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId || (agentId && agentId.startsWith('default-')) || preloadedAgent) {
        setLoadingAgent(false);
        return;
      }

      try {
        const data = await api.llmRuntime.getAgent(agentId);
        setAgent(data);
      } catch (err) {
        console.error('Failed to load agent details', err);
        setAgentError('Unable to load agent details');
      } finally {
        setLoadingAgent(false);
      }
    };

    fetchAgent();
  }, [agentId, preloadedAgent]);

  // Call backend API to get AI response
  const callAgentAPI = async (userMessage) => {
    try {
      const response = await api.fetchWithAuth('/api/v1/chat', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 'current-user',
          session_id: Date.now().toString(),
          agent_id: agent?.id,
          agent_type: agent?.type || 'license',
          message: userMessage,
          access_token: auth.getToken() || ''
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message || 'I could not generate a response. Please try again.';
    } catch (error) {
      console.error('Error calling agent API:', error);
      return `Error: ${error.message}. Please check your connection and try again.`;
    }
  };

  // Handle file attachment
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles(prev => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle approval button click
  const handleApprovalButtonClick = async (action) => {
    if (!pendingApproval) return;
    
    setApprovalProcessing(true);
    try {
      const endpoint = action === 'approve' 
        ? '/api/v1/approvals/button-approve'
        : '/api/v1/approvals/button-reject';
      
      const response = await api.fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          approval_id: pendingApproval.approval_id
        })
      });

      if (!response.ok) {
        throw new Error(`Approval request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Add system message indicating approval action
      const actionMessage = {
        id: Date.now(),
        text: action === 'approve' 
          ? `✓ License approval confirmed. Proceeding with installation...` 
          : `✗ License approval rejected.`,
        sender: 'system',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, actionMessage]);
      
      // If approved, execute the license installation
      if (action === 'approve') {
        try {
          const executeResponse = await api.fetchWithAuth(
            `/api/v1/approvals/${pendingApproval.approval_id}`,
            {
              method: 'POST',
              body: JSON.stringify({
                session_id: pendingApproval.session_id
              })
            }
          );
          
          if (executeResponse.ok) {
            const executeData = await executeResponse.json();
            const resultMessage = {
              id: Date.now() + 1,
              text: executeData.message || '✓ License installation completed!',
              sender: 'system',
              timestamp: new Date(),
              isSuccess: executeData.success
            };
            setMessages(prev => [...prev, resultMessage]);
            console.log('License execution result:', executeData);
          } else {
            const errorData = await executeResponse.json();
            const errorMessage = {
              id: Date.now() + 1,
              text: errorData.message || '✗ License installation failed',
              sender: 'system',
              timestamp: new Date(),
              isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        } catch (executeError) {
          console.error('Error executing license installation:', executeError);
          const errorMessage = {
            id: Date.now() + 1,
            text: `Error during installation: ${executeError.message}`,
            sender: 'system',
            timestamp: new Date(),
            isError: true
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }
      
      setPendingApproval(null);
      
      console.log(`Approval ${action}ed:`, data);
    } catch (error) {
      console.error(`Error processing approval ${action}:`, error);
      const errorMessage = {
        id: Date.now(),
        text: `Error processing approval: ${error.message}`,
        sender: 'system',
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setApprovalProcessing(false);
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
        timestamp: new Date(),
        files: attachedFiles.length > 0 ? attachedFiles.map(f => f.name) : null
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
      const filesToSend = [...attachedFiles];
      setInputValue('');
      setAttachedFiles([]);
      setIsTyping(true);

      try {
        // Convert files to base64 and include in request
        const filesData = [];
        for (const file of filesToSend) {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          filesData.push({
            name: file.name,
            type: file.type,
            data: base64
          });
        }

        // Call backend API with file data
        const response = await api.fetchWithAuth('/api/v1/chat', {
          method: 'POST',
          body: JSON.stringify({
            user_id: 'current-user',
            session_id: Date.now().toString(),
            agent_id: agent?.id,
            agent_type: agent?.type || 'license',
            message: currentInput,
            files: filesData.length > 0 ? filesData : null,
            access_token: auth.getToken() || ''
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponseText = data.message || 'I could not generate a response. Please try again.';
        
        console.log('Full response data:', data);
        
        // Check if approval is required - check for approval_metadata from backend
        if (data.approval_metadata && data.approval_metadata.approval_id) {
          console.log('Approval triggered with approval_id:', data.approval_metadata.approval_id);
          console.log('Approval metadata:', data.approval_metadata);
          
          setPendingApproval({
            approval_id: data.approval_metadata.approval_id,
            filename: data.approval_metadata.filename || 'license file',
            expires_at: data.approval_metadata.expires_at,
            session_id: data.session_id
          });
        } else {
          console.log('No approval required:', {
            has_approval_metadata: !!data.approval_metadata,
            approval_metadata: data.approval_metadata
          });
        }
        
        setIsTyping(false);
        
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
        
        console.log('Agent Response:', aiResponseText);
        console.log('Chat History:', newHistory);
      } catch (error) {
        console.error('Error in chat:', error);
        setIsTyping(false);
        const errorMessage = {
          id: Date.now() + 2,
          text: `Error: ${error.message}`,
          sender: 'ai',
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  }, [inputValue, chatHistory, agent, attachedFiles]);

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
                {agent?.name || 'Agent'}
              </div>
              
              {/* Role */}
              <p className="text-sm text-gray-600">{agent?.description || agent?.role || 'License Agent'}</p>
              
              {/* Welcome message */}
              <h2 className="text-2xl font-bold text-gray-900 ">
                {loadingAgent ? (
                  'Loading agent...'
                ) : (
                  <Typewriter
                    words ={["How May I Help You ?"]}
                    cursor
                    cursorStyle="|"
                    typeSpeed={70}
                    deleteSpeed={30}
                    delaySpeed={1200}
                  />
                )}
              </h2>
              {agentError && (
                <p className="text-xs text-red-500">{agentError}</p>
              )}
            </div>

            {/* Messages container */}
            <div className=" h-[250px] overflow-y-auto px-4">
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
                            : message.sender === 'system'
                            ? 'bg-yellow-50 text-gray-800 rounded-bl-sm border border-yellow-200'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Approval Buttons */}
                  {pendingApproval && (
                    <div className="flex justify-start">
                      <div className="bg-green-50 border-2 border-green-300 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[75%]">
                        <p className="text-sm font-semibold text-green-800 mb-3">Approve license installation?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprovalButtonClick('approve')}
                            disabled={approvalProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {approvalProcessing ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleApprovalButtonClick('reject')}
                            disabled={approvalProcessing}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {approvalProcessing ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </>
                            )}
                          </button>
                        </div>
                        {pendingApproval.expires_at && (
                          <p className="text-xs text-gray-600 mt-2">
                            Approval expires at: {new Date(pendingApproval.expires_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
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
              {/* Attached Files Display */}
              {attachedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2 pb-3 border-b border-gray-200">
                  {attachedFiles.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 text-sm"
                    >
                      <span className="text-blue-600">📎</span>
                      <span className="text-gray-700 truncate max-w-[150px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-gray-400 hover:text-gray-600 ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                multiple
                accept=".lic,.txt,.pem,.crt,.key,.license"
                style={{ display: 'none' }}
              />

              <div className="flex items-center gap-3">
                {/* Attach button */}
                <button
                  onClick={handleAttachClick}
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