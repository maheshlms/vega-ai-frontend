import React, { useState, useCallback, useRef, useEffect } from 'react';
import { IoArrowBackCircle, IoClose, IoSend, IoMicOutline, IoAttachOutline, IoDownloadOutline } from "react-icons/io5";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { HiSparkles } from "react-icons/hi2";
import { Typewriter } from "react-simple-typewriter";    
import api from '../utils/api';
import { auth } from '../utils/auth';
import { FaArrowLeft } from "react-icons/fa";

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

const AgentChat: React.FC = () => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const location = useLocation();
  const preloadedAgent = location.state?.agent;
  const [agent, setAgent] = useState<Agent | null>(preloadedAgent || null);
  const [agentError, setAgentError] = useState<string>('');
  const [loadingAgent, setLoadingAgent] = useState<boolean>(!preloadedAgent);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Chat history in the required format: { 'User1': <message>, 'Agent1': <message>, ... }
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});

  // HeyGen state - to be passed to AI Assist page
  const [heygenScript, setHeygenScript] = useState<string>('');

  // **NEW: State to control welcome message visibility**
  const [showWelcomeMessage, setShowWelcomeMessage] = useState<boolean>(true);

  // File upload state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Approval state (for button-based approvals in dev/staging)
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [approvalProcessing, setApprovalProcessing] = useState<boolean>(false);
  
  // Download state
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);
  
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
  const callAgentAPI = async (userMessage: string): Promise<string> => {
    try {
      // Use existing session ID or create a new one
      const currentSessionId = sessionIdRef.current || Date.now().toString();
      console.log('Sending to backend - sessionIdRef.current:', sessionIdRef.current, 'currentSessionId:', currentSessionId);
      
      const response = await api.fetchWithAuth('/api/v1/chat', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 'current-user',
          session_id: currentSessionId,
          user_session_id: auth.getSessionId(),
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
    } catch (error: any) {
      console.error('Error calling agent API:', error);
      return `Error: ${error.message}. Please check your connection and try again.`;
    }
  };

  // Handle file attachment
  const handleAttachClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
    console.log('[handleFileSelect] Files selected:', files.length, files.map(f => f.name));
    if (files.length > 0) {
      // Only allow one file at a time - replace existing file
      const newFile = files[0];
      setAttachedFiles([newFile]);
      console.log('[handleFileSelect] Set single file:', newFile.name);
    }
    // Reset the file input value so the same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number): void => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle file download from metadata (e.g., CSR files)
  const handleDownloadFromMetadata = useCallback((content: string, filename: string, mimeType: string = 'application/octet-stream') => {
    try {
      // Create a blob from the content
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('File downloaded:', filename);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file. Please try again.');
    }
  }, []);

  // Handle file download
  const handleDownloadFile = async (message: Message): Promise<void> => {
    if (!message.file_path) return;
    
    setDownloadingFileId(message.id);
    
    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const downloadUrl = `${backendUrl}${message.file_path}`;
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.filename || 'download.txt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('File downloaded successfully:', message.filename);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      alert(`Failed to download file: ${error.message}`);
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Handle approval button click
  const handleApprovalButtonClick = async (action: string): Promise<void> => {
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
      const actionMessage: Message = {
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
            const resultMessage: Message = {
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
            const errorMessage: Message = {
              id: Date.now() + 1,
              text: errorData.message || '✗ License installation failed',
              sender: 'system',
              timestamp: new Date(),
              isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        } catch (executeError: any) {
          console.error('Error executing license installation:', executeError);
          const errorMessage: Message = {
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
    } catch (error: any) {
      console.error(`Error processing approval ${action}:`, error);
      const errorMessage: Message = {
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
    console.log('[handleSend] START - inputValue:', inputValue.trim().substring(0, 50), 'attachedFiles count:', attachedFiles.length);
    console.log('[handleSend] attachedFiles:', attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    if (inputValue.trim()) {
      // **NEW: Hide welcome message when first message is sent**
      setShowWelcomeMessage(false);

      const userMessageIndex = Object.keys(chatHistory).filter(k => k.startsWith('User')).length + 1;
      const userKey = `User${userMessageIndex}`;
      
      const userMessage: Message = {
        id: Date.now(),
        text: inputValue,
        sender: 'user',
        timestamp: new Date(),
        files: attachedFiles.length > 0 ? attachedFiles.map(f => f.name) : undefined
      };
      
      // Update messages array for display
      setMessages(prev => [...prev, userMessage]);
      
      // Update chat history with new user message
      const updatedHistory: ChatHistory = {
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
        const filesData: FileData[] = [];
        for (const file of filesToSend) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              console.log('[handleSend] File converted successfully:', file.name);
              resolve(reader.result as string);
            };
            reader.onerror = (error) => {
              console.error('[handleSend] File conversion ERROR:', file.name, error);
              reject(error);
            };
            reader.readAsDataURL(file);
          });
          filesData.push({
            name: file.name,
            type: file.type,
            data: base64
          });
        }

        console.log('[handleSend] All files converted. Total filesData:', filesData.length);
        console.log('[handleSend] filesData summary:', filesData.map(f => ({ name: f.name, type: f.type, dataLength: f.data.length })));

        // Call backend API with file data
        const currentSessionId = sessionIdRef.current || Date.now().toString();
        console.log('[handleSend] Sending to backend - sessionIdRef.current:', sessionIdRef.current, 'currentSessionId:', currentSessionId);
        console.log('[handleSend] Request payload:', {
          user_id: 'current-user',
          session_id: currentSessionId,
          agent_id: agent?.id,
          agent_type: agent?.type || 'license',
          message_length: currentInput.length,
          files_count: filesData.length,
          files: filesData.map(f => ({ name: f.name, type: f.type }))
        });
        
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
            access_token: auth.getToken() || ''
          })
        });

        if (!response.ok) {
          console.error('[handleSend] API response NOT OK:', response.status, response.statusText);
          throw new Error(`API error: ${response.statusText}`);
        }

        console.log('[handleSend] API response OK, parsing JSON...');
        const data = await response.json();
        console.log('[handleSend] Response data received:', data);
        const aiResponseText = data.message || 'I could not generate a response. Please try again.';
        
        console.log('Full response data:', data);
        
        // Store session_id from response for future messages
        if (data.session_id && !sessionIdRef.current) {
          sessionIdRef.current = data.session_id;
          console.log('Stored session_id in ref from response:', data.session_id);
        } else if (!data.session_id) {
          console.warn('No session_id in response data');
        } else {
          console.log('session_id already stored, not updating. Current:', sessionIdRef.current, 'Response has:', data.session_id);
        }
        
        // Check if button approval is required (approval_method == 'button' for dev/staging)
        if (data.approval_metadata && data.approval_metadata.approval_id && data.approval_metadata.approval_method === 'button') {
          console.log('Button approval triggered with approval_id:', data.approval_metadata.approval_id);
          
          setPendingApproval({
            approval_id: data.approval_metadata.approval_id,
            filename: data.approval_metadata.filename || 'license file',
            expires_at: data.approval_metadata.expires_at,
            session_id: data.session_id
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
        
        // Update chat history with agent response
        const newHistory: ChatHistory = {
          ...updatedHistory,
          [agentKey]: aiResponseText
        };
        setChatHistory(newHistory);
        
        // Store the script for HeyGen
        setHeygenScript(aiResponseText);
        
        console.log('Agent Response:', aiResponseText);
        console.log('Chat History:', newHistory);
      } catch (error: any) {
        console.error('[handleSend] ERROR occurred:', error);
        console.error('[handleSend] Error details:', { message: error.message, stack: error.stack });
        setIsTyping(false);
        const errorMessage: Message = {
          id: Date.now() + 2,
          text: `Error: ${error.message}`,
          sender: 'ai',
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else {
      console.log('[handleSend] SKIPPED - No input value (inputValue empty)');
    }
  }, [inputValue, chatHistory, agent, attachedFiles]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
    sessionIdRef.current = null;
    setShowWelcomeMessage(true);
  }, []);

  const handleBack = useCallback(() => {
    navigate('/agents');
  }, [navigate]);

  const handleExecute = useCallback(() => {
    navigate('/agents/agentchat/execute');
  }, [navigate]);

  const handleAIAssistance = useCallback(() => {
    navigate('/agents/agentchat/aiassist', { 
      state: { 
        script: heygenScript,
        chatHistory: chatHistory 
      } 
    });
  }, [navigate, heygenScript, chatHistory]);

  return (
    <div className="w-full max-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Header */}
      <div className="px-10 py-5 flex items-center justify-between flex-shrink-0">
        {/* Left side - Back button and title */}
        <div className="flex items-center gap-2">
          <button
              onClick={() => handleBack()}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3"
            >
             <FaArrowLeft size={16} />
            <span className="text-sm">Back</span>
          </button>
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
      <div className="flex justify-center px-4 flex-1 pb-2">
        <div className="bg-white w-full max-w-7xl rounded-xl shadow-lg relative flex flex-col" style={{ height: 'calc(100vh - 170px)' }}>
          
          {/* Avatar */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-30 h-30 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
              <img 
                src="/avatar.png" 
                alt="Astra"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjOTMzM0VBIi8+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNTAiIHI9IjI0IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMzIgMTEyQzMyIDk1LjQzMTUgNDUuNDMxNSA4MiA2MiA4Mkg2NkM4Mi41Njg1IDgyIDk2IDk1LjQzMTUgOTYgMTEyVjEyOEgzMlYxMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                }}
              />
            </div>
          </div>

          {/* Content area */}
          <div className="pt-1 pb-6 px-6 flex flex-col flex-1 overflow-hidden">
            
            {/* Agent info */}
            <div className="flex flex-col items-center text-center space-y-2 pt-8">
              {/* Name badge */}
              <div className="bg-blue-100 text-blue-700 px-4 rounded-full text-sm font-medium z-11">
                {agent?.name || 'Agent'}
              </div>
              
              {/* Role */}
              <p className="text-sm text-gray-600">{agent?.description || agent?.role || 'License Agent'}</p>
              
              {/* Welcome message - only show if showWelcomeMessage is true */}
              {showWelcomeMessage && (
                <h2 className="text-2xl font-bold text-gray-900 ">
                  {loadingAgent ? (
                    'Loading agent...'
                  ) : (
                    <Typewriter
                      words={["How May I Help You ?"]}
                      cursor
                      cursorStyle="|"
                      typeSpeed={70}
                      deleteSpeed={30}
                      delaySpeed={1200}
                    />
                  )}
                </h2>
              )}
              {agentError && (
                <p className="text-xs text-red-500">{agentError}</p>
              )}
            </div>

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto px-4 mb-4 mt-10">
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
                        {/* Display file emoji and names when files are attached */}
                        {message.files && message.files.length > 0 && (
                          <div className={`mb-2 pb-2 border-b ${
                            message.sender === 'user' 
                              ? 'border-blue-400' 
                              : 'border-gray-300'
                          }`}>
                            <div className="flex items-start gap-2">
                              <span className="text-base">📎</span>
                              <div className="flex-1">
                                {message.files.map((filename, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`text-xs ${
                                      message.sender === 'user' 
                                        ? 'text-blue-100' 
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {filename}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div 
                          className={`text-sm leading-relaxed break-words ${message.sender === 'user' ? 'whitespace-pre-wrap' : 'whitespace-normal'}`}
                          dangerouslySetInnerHTML={{ __html: message.text }}
                        />
                        
                        {/* Download button for files with metadata (e.g., CSR files, certificates) */}
                        {message.metadata?.type && message.metadata?.filename && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <button
                              onClick={() => {
                                const content = message.metadata?.csr_content || message.metadata?.content || '';
                                const filename = message.metadata?.filename || 'download.txt';
                                const mimeType = message.metadata?.type === 'csr_generated' 
                                  ? 'application/pkcs10' 
                                  : 'application/octet-stream';
                                handleDownloadFromMetadata(content, filename, mimeType);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors w-full justify-center"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download {message.metadata?.filename}
                            </button>
                          </div>
                        )}
                        
                        {/* Download button for files */}
                        {message.file_path && message.sender === 'ai' && (
                          <button
                            onClick={() => handleDownloadFile(message)}
                            disabled={downloadingFileId === message.id}
                            className="mt-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                          >
                            {downloadingFileId === message.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <IoDownloadOutline size={18} />
                                <span>Download {message.filename || 'File'}</span>
                              </>
                            )}
                          </button>
                        )}
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
                  
                  {/* Button Approval Section */}
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
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 border-t border-gray-200 pt-4">
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